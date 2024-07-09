<?php

require_once 'Global.php';

class PostStudentFunctions extends GlobalMethods
{
    private $pdo;

    public function __construct(\PDO $pdo)
    {
        $this->pdo = $pdo;
    }
    //post functions

    public function add_profile_update_request($data)
    {
        // Check if required fields are set
        if (!isset($data->user_id, $data->message)) {
            return $this->sendPayload(null, 'failed', "Incomplete request data.", 400);
        }

        // Validate user_id
        if (!is_int($data->user_id)) {
            return $this->sendPayload(null, 'failed', "Invalid user ID.", 400);
        }

        $user_id = $data->user_id;
        $message = $data->message;

        // Check if the user exists
        $sql = "SELECT COUNT(*) FROM user WHERE user_id = ?";
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute([$user_id]);

        if ($stmt->fetchColumn() == 0) {
            return $this->sendPayload(null, 'failed', "User not found.", 404);
        }

        // Insert the profile update request
        $sql = "INSERT INTO profile_update_requests (user_id, message, status, created_at) 
                VALUES (?, ?, 'pending', NOW())";

        try {
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute([$user_id, $message]);

            if ($stmt->rowCount() > 0) {
                return $this->sendPayload(null, 'success', "Profile update request added successfully.", 200);
            } else {
                return $this->sendPayload(null, 'failed', "Failed to add profile update request.", 500);
            }
        } catch (PDOException $e) {
            error_log("Database error: " . $e->getMessage());
            return $this->sendPayload(null, 'failed', $e->getMessage(), 500);
        }
    }


    //edit user profile 
    public function editUser($data, $user_id)
    {
        $sql = "UPDATE user 
                SET first_name = ?, last_name = ?, year_level = ?, course = ?, block = ?, email = ?
                WHERE user_id = ?";
        try {
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute([
                $data->first_name,
                $data->last_name,
                $data->year_level,
                $data->course,
                $data->block,
                $data->email,
                $user_id
            ]);

            if ($stmt->rowCount() > 0) {
                return $this->sendPayload(null, 'success', "User updated successfully.", 200);
            } else {
                return $this->sendPayload(null, 'failed', "Failed to update user.", 500);
            }
        } catch (PDOException $e) {
            error_log("Database error: " . $e->getMessage());
            return $this->sendPayload(null, 'failed', $e->getMessage(), 500);
        }
    }


    //register for event
    public function registerUserForEvent($event_id, $user_id)
    {
        try {

            error_log("Registering user: $user_id for event: $event_id");


            // $userExists = $this->checkUserExists($user_id);
            // $eventExists = $this->checkEventExists($event_id);

            // if (!$userExists) {
            //     return $this->sendPayload(null, 'failed', "User does not exist.", 400);
            // }

            // if (!$eventExists) {
            //     return $this->sendPayload(null, 'failed', "Event does not exist.", 400);
            // }


            // Check if the user is already registered for the event
            $sql = "SELECT COUNT(*) AS count FROM event_registration WHERE event_id = ? AND user_id = ?";
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute([$event_id, $user_id]);
            $row = $stmt->fetch(PDO::FETCH_ASSOC);

            if ($row['count'] != 0) {
                return $this->sendPayload(null, 'failed', "User is already registered for this event.", 400);
            }

            // Check if the event registration dates are valid
            $sql = "SELECT event_registration_start, event_registration_end FROM events WHERE event_id = ?";
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute([$event_id]);
            $event = $stmt->fetch(PDO::FETCH_ASSOC);

            $currentDate = date('Y-m-d');
            $registrationStartDate = date('Y-m-d', strtotime($event['event_registration_start']));
            $registrationEndDate = date('Y-m-d', strtotime($event['event_registration_end']));

            if ($currentDate < $registrationStartDate) {
                return $this->sendPayload(null, 'failed', "Event registration is not yet available.", 400);
            }

            if ($currentDate > $registrationEndDate) {
                return $this->sendPayload(null, 'failed', "Event registration has ended.", 400);
            }

            // Check if the event has reached maximum attendees
            $sql = "SELECT COUNT(*) AS count FROM event_registration WHERE event_id = ?";
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute([$event_id]);
            $attendeeCount = $stmt->fetch(PDO::FETCH_ASSOC)['count'];

            $sql = "SELECT max_attendees FROM events WHERE event_id = ?";
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute([$event_id]);
            $maxAttendees = $stmt->fetch(PDO::FETCH_ASSOC)['max_attendees'];

            if ($attendeeCount >= $maxAttendees) {
                return $this->sendPayload(null, 'failed', "Event has reached maximum attendees.", 400);
            }

            // Check if there is conflicting start dates within your registered events
            $sql = "SELECT er.*, e.event_name
            FROM event_registration er
            JOIN events e ON er.event_id = e.event_id
            WHERE e.event_start_date = (
            SELECT event_start_date
            FROM events
            WHERE event_id = ?
            ) AND user_id = $user_id";
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute([$event_id]);
            $result = $stmt->fetch(PDO::FETCH_ASSOC);

            if ($result) {
                return $this->sendPayload($result, 'failed', "You have an existing registered event that has a conflicting start date with this event.", 409);
            }

            // Register the user for the event
            $sql = "INSERT INTO event_registration (event_id, user_id) VALUES (?, ?)";
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute([$event_id, $user_id]);

            if ($stmt->rowCount() != 0) {
                error_log("Logging activity for user: $user_id for event: $event_id");

                $this->logActivity($user_id, $event_id, 'register', 'User registered for event');
                return $this->sendPayload(null, 'success', "User registered for event successfully.", 200);
            } else {
                return $this->sendPayload(null, 'failed', "Failed to register user for event.", 500);
            }
        } catch (PDOException $e) {
            error_log("Database error: " . $e->getMessage());
            return $this->sendPayload(null, 'failed', $e->getMessage(), 500);
        }
    }


    public function unregisterFromEvent($event_id, $user_id)
    {
        $query = "SELECT COUNT(*) as count FROM event_registration WHERE user_id = :userId AND event_id = :eventId";
        $stmt = $this->pdo->prepare($query);
        $stmt->execute([':userId' => $user_id, ':eventId' => $event_id]);
        $count = $stmt->fetch(PDO::FETCH_ASSOC)['count'];

        if ($count == 0) {
            return;
        }

        $sql = "DELETE FROM event_registration WHERE event_id = ? AND user_id = ?";

        try {
            error_log("Unregistering user: $user_id from event: $event_id");
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute([$event_id, $user_id]);

            if ($stmt->rowCount() > 0) {
                error_log("Logging activity for user: $user_id from event: $event_id");
                $this->logActivity($user_id, $event_id, 'unregister', 'User unregistered from event');
                return $this->sendPayload(null, 'success', "User unregistered from event successfully.", 200);
            } else {
                return $this->sendPayload(null, 'failed', "You're not registered to this event!.", 404);
            }
        } catch (PDOException $e) {
            error_log("Database error: " . $e->getMessage());
            return $this->sendPayload(null, 'failed', $e->getMessage(), 500);
        }
    }

    function logActivity($userId, $eventId, $activityType, $details)
    {
        // Check if the log entry already exists
        $query = "SELECT COUNT(*) as count FROM activity_log WHERE user_id = :userId AND event_id = :eventId AND activity_type = :activityType AND details = :details";
        $stmt = $this->pdo->prepare($query);
        $stmt->execute([':userId' => $userId, ':eventId' => $eventId, ':activityType' => $activityType, ':details' => $details]);
        $count = $stmt->fetch(PDO::FETCH_ASSOC)['count'];

        if ($count == 0) {
            // Insert the log entry only if it doesn't exist
            $query = "INSERT INTO activity_log (user_id, event_id, activity_type, details, created_at) VALUES (:userId, :eventId, :activityType, :details, NOW())";
            $stmt = $this->pdo->prepare($query);
            $stmt->execute([':userId' => $userId, ':eventId' => $eventId, ':activityType' => $activityType, ':details' => $details]);
        }
    }


    private function checkUserExists($user_id)
    {
        $sql = "SELECT COUNT(*) AS count FROM user WHERE user_id = ?";
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute([$user_id]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        return $row['count'] > 0;
    }

    private function checkEventExists($event_id)
    {
        $sql = "SELECT COUNT(*) AS count FROM events WHERE event_id = ?";
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute([$event_id]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        return $row['count'] > 0;
    }


    //post evaluation 
    public function addEventFeedback($event_id, $user_id, $data)
    {
        if (!isset($data->overall_satisfaction) || !isset($data->content_quality) || !isset($data->speaker_effectiveness) || !isset($data->venue_rating) || !isset($data->logistics_rating) || !isset($data->satisfied) || !isset($data->joined) || !isset($data->learned) || !isset($data->future) || !isset($data->liked) || !isset($data->attend) || !isset($data->recommend)) {
            return $this->sendPayload(null, 'failed', "Incomplete feedback data.", 400);
        }

        $overall_satisfaction = $data->overall_satisfaction;
        $content_quality = $data->content_quality;
        $speaker_effectiveness = $data->speaker_effectiveness;
        $venue_rating = $data->venue_rating;
        $logistics_rating = $data->logistics_rating;
        $satisfied = $data->satisfied;
        $joined = $data->joined;
        $learned = $data->learned;
        $future = $data->future;
        $liked = $data->liked;
        $attend = $data->attend;
        $recommend = $data->recommend;
        $improvement_suggestions = $data->improvement_suggestions ?? '';
        $additional_comments = $data->additional_comments ?? '';
        $remarks = 'Feedback submitted';

        // Check if the event has ended
        $sql = "SELECT event_end_date FROM events WHERE event_id = ?";
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute([$event_id]);
        $event = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$event || strtotime($event['event_end_date']) > time()) {
            return $this->sendPayload(null, 'failed', "Feedback submission is only allowed after the event has ended.", 400);
        }

        // Check if the user is registered for the event
        $sql = "SELECT COUNT(*) AS count FROM event_registration WHERE event_id = ? AND user_id = ?";
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute([$event_id, $user_id]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);

        if ($row['count'] == 0) {
            return $this->sendPayload(null, 'failed', "You are not registered for this event.", 400);
        }

        $sql = "SELECT COUNT(*) AS count FROM feedback WHERE event_id = ? AND user_id = ?";
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute([$event_id, $user_id]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);

        if ($row['count'] > 0) {
            return $this->sendPayload(null, 'failed', "You have already submitted feedback for this event.", 400);
        }

        $sql = "INSERT INTO feedback (event_id, user_id, overall_satisfaction, content_quality, speaker_effectiveness, venue_rating, logistics_rating, satisfied, joined, learned, future, liked, attend, recommend, improvement_suggestions, additional_comments, remarks) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ? ,? ,? ,? ,? ,?)";
        try {
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute([$event_id, $user_id, $overall_satisfaction, $content_quality, $speaker_effectiveness, $venue_rating, $logistics_rating, $satisfied, $joined, $learned, $future, $liked, $attend, $recommend, $improvement_suggestions, $additional_comments, $remarks]);

            if ($stmt->rowCount() > 0) {
                return $this->sendPayload(null, 'success', "Feedback added successfully.", 200);
            } else {
                return $this->sendPayload(null, 'failed', "Failed to add feedback.", 500);
            }
        } catch (PDOException $e) {
            error_log("Database error: " . $e->getMessage());
            return $this->sendPayload(null, 'failed', $e->getMessage(), 500);
        }
    }



    public function updateStudentImage($user_id)
    {
        $fileData = file_get_contents($_FILES["file"]["tmp_name"]);

        $sql = "UPDATE user SET avatar = ? WHERE user_id = $user_id";
        try {
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute(
                [
                    $fileData
                ]
            );
            return $this->sendPayload(null, "success", "Successfully uploaded file", 200);
        } catch (PDOException $e) {

            $errmsg = $e->getMessage();
            $code = 400;
        }
        return $this->sendPayload(null, "failed", $errmsg, $code);
    }

    public function uploadStudentAttendanceImage($event_id, $user_id)
    {
        // Check if user has already submitted an image for this event
        $sql_check = "SELECT COUNT(*) AS count FROM attendance WHERE event_id = ? AND user_id = ?";
        try {
            $stmt_check = $this->pdo->prepare($sql_check);
            $stmt_check->execute([$event_id, $user_id]);
            $result = $stmt_check->fetch(PDO::FETCH_ASSOC);

            if ($result['count'] > 0) {
                return $this->sendPayload(null, 'failed', "You have already submitted an image for this event.", 400);
            }

            // Proceed with uploading the attendance image
            $fileData = file_get_contents($_FILES["file"]["tmp_name"]);

            $sql_insert = "INSERT INTO attendance (event_id, user_id, image) VALUES (?, ?, ?)";
            $stmt_insert = $this->pdo->prepare($sql_insert);
            $stmt_insert->execute([$event_id, $user_id, $fileData]);

            if ($stmt_insert->rowCount() > 0) {
                return $this->sendPayload(null, "success", "Successfully uploaded file", 200);
            } else {
                return $this->sendPayload(null, "failed", "Failed to upload attendance image.", 500);
            }
        } catch (PDOException $e) {
            error_log("Database error: " . $e->getMessage());
            return $this->sendPayload(null, "failed", $e->getMessage(), 500);
        }
    }
}
