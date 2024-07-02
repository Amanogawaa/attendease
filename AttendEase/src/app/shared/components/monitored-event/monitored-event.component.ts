import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { EventService } from '../../../core/service/event.service';
import { Event } from '../../../interfaces/EventInterface';
import { MatTabsModule } from '@angular/material/tabs';
import { CommonModule } from '@angular/common';
import { AuthserviceService } from '../../../core/service/authservice.service';
import { formatDistanceToNow, isBefore } from 'date-fns';

@Component({
  standalone: true,
  imports: [MatTabsModule, CommonModule],
  selector: 'app-monitored-event',
  templateUrl: './monitored-event.component.html',
  styleUrls: ['./monitored-event.component.css'],
  encapsulation: ViewEncapsulation.None,
})
export class MonitoredEventComponent implements OnInit {
  events: Event[] = [];
  selectedEvent: Event | null = null;
  registeredUsers: any[] = [];
  registeredUsersMap: { [eventId: number]: any[] } = {};
  currentIndex: number = 0;
  currId: any;

  constructor(
    private eventService: EventService,
    private service: AuthserviceService
  ) {}

  ngOnInit(): void {
    this.currId = this.service.getCurrentUserId();
    this.loadData(this.currId);
    if (this.events.length > 0) {
      this.selectedEvent = this.events[this.currentIndex];
      this.loadRegisteredUsers(this.selectedEvent.event_id);
    }
  }

  loadData(id: any) {
    if (id) {
      this.eventService.getApprovedOrganizerEvents(id).subscribe((res: any) => {
        this.events = res.payload;

        this.events.forEach((event) => {
          this.loadRegisteredUsers(event.event_id);
        });

        if (this.events.length > 0) {
          this.selectedEvent = this.events[this.currentIndex];
        }
      });
    }
  }

  loadRegisteredUsers(eventId: number): void {
    this.eventService.getRegisteredUser(eventId).subscribe((res: any) => {
      this.registeredUsersMap[eventId] = res.payload || [];
    });
  }

  prevEvent(): void {
    if (this.currentIndex > 0) {
      this.currentIndex--;
      this.selectedEvent = this.events[this.currentIndex];
      this.loadRegisteredUsers(this.selectedEvent.event_id);
    }
  }

  nextEvent(): void {
    if (this.currentIndex < this.events.length - 1) {
      this.currentIndex++;
      this.selectedEvent = this.events[this.currentIndex];
      this.loadRegisteredUsers(this.selectedEvent.event_id);
    }
  }

  formatRegistrationDate(date: string): string {
    return formatDistanceToNow(new Date(date), { addSuffix: true });
  }

  isNewUser(user: any): boolean {
    // Example: Check if the registration date is within the last minute
    const oneMinuteAgo = new Date();
    oneMinuteAgo.setMinutes(oneMinuteAgo.getMinutes() - 1);
    return isBefore(new Date(user.registration_date), oneMinuteAgo);
  }
}
