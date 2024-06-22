<?php

require_once 'Global.php';

class GetEvent extends GlobalMethods
{
    private $pdo;

    public function __construct(\PDO $pdo)
    {
        $this->pdo = $pdo;
    }

    private function get_records($table, $conditions = null, $columns = '*')
    {
        $sqlStr = "SELECT $columns FROM $table";
        if ($conditions != null) {
            $sqlStr .= " WHERE " . $conditions;
        }
        $result = $this->executeQuery($sqlStr);

        if ($result['code'] == 200) {
            return $this->sendPayload($result['data'], 'success', "Successfully retrieved data.", $result['code']);
        }
        return $this->sendPayload(null, 'failed', "Failed to retrieve data.", $result['code']);
    }

    //nageexecute ng query
    private function executeQuery($sql)
    {
        $data = array();
        $errmsg = "";
        $code = 0;

        try {
            $statement = $this->pdo->query($sql);
            if ($statement) {
                $result = $statement->fetchAll(PDO::FETCH_ASSOC);
                foreach ($result as $record) {
                    // Handle BLOB data
                    if (isset($record['file_data'])) {

                        $record['file_data'] = base64_encode($record['file_data']);
                    }
                    array_push($data, $record);
                }
                $code = 200;
                return array("code" => $code, "data" => $data);
            } else {
                $errmsg = "No data found.";
                $code = 404;
            }
        } catch (\PDOException $e) {
            $errmsg = $e->getMessage();
            $code = 403;
        }
        return array("code" => $code, "errmsg" => $errmsg);
    }


    // gets all event
    public function getEvents($event_id = null)
    {
        $columns = "event_id, event_name, event_description, event_location, event_start_date, event_end_date, event_registration_start, event_registration_end, session, max_attendees, categories, organizer_name";
        $condition = ($event_id !== null) ? "event_id = $event_id" : null;
        return $this->get_records('events', $condition, $columns);
    }

    //gets all registered user on a event
    public function getRegisteredUserForEvent($event_id)
    {
        $sql = "SELECT u.first_name, u.last_name, u.email FROM user u
        INNER JOIN event_registration er ON u.user_id = er.user_id 
        WHERE er.event_id = :event_id";

        $stmt = $this->pdo->prepare($sql);
        $stmt->bindParam(':event_id', $event_id, PDO::PARAM_INT);
        $stmt->execute();

        $data = $stmt->fetchAll(PDO::FETCH_ASSOC);
        $rowCount = $stmt->rowCount();

        if ($rowCount > 0) {
            return $this->sendPayload($data, 'success', "Successfully retrieved users registered for the event.", 200);
        } else {
            return $this->sendPayload(null, 'failed', "No users registered for the event.", 404);
        }
    }


    //returns the event id
    public function getEventById($eventId)
    {
        try {
            $sql = "SELECT event_id FROM events WHERE event_id = :event_id";

            $stmt = $this->pdo->prepare($sql);
            $stmt->bindParam(':event_id', $eventId, PDO::PARAM_INT);
            $stmt->execute();

            $eventData = $stmt->fetch(PDO::FETCH_ASSOC);

            if ($eventData) {
                return $eventData['event_id'];
            } else {
                return false;
            }
        } catch (PDOException $e) {
            return false;
        }
    }

    //gets image of evnet
    public function getEventImage($event_id)
    {
        $fileInfo = $this->geteventImg($event_id);

        if ($fileInfo['event_image'] !== null) {
            $fileData = $fileInfo['event_image'];

            header('Content-Type: image/png');
            header('Cache-Control: no-cache, no-store, must-revalidate');
            echo $fileData;
            exit();
        } else {
            echo "Event image not found or not uploaded.";
            http_response_code(404);
        }
    }

    public function geteventImg($event_id = null)
    {
        $columns = "event_image";
        $condition = ($event_id !== null) ? "event_id = $event_id" : null;
        $result = $this->get_records('events', $condition, $columns);

        if ($result['status']['remarks'] === 'success' && isset($result['payload'][0]['event_image'])) {
            $fileData = $result['payload'][0]['event_image'];
            return array("event_image" => $fileData);
        } else {
            return array("event_image" => null);
        }
    }
}