import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
} from '@angular/core';
import { AuthserviceService } from '../../../../core/service/authservice.service';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { EventService } from '../../../../core/service/event.service';
import { NgxPaginationModule } from 'ngx-pagination';
import { Router } from '@angular/router';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Subscription, interval, of, switchMap } from 'rxjs';
import { Event } from '../../../../interfaces/EventInterface';

@Component({
  selector: 'app-events',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, NgxPaginationModule, MatTooltipModule],
  templateUrl: './events.component.html',
  styleUrls: ['./events.component.css'],
})
export class EventsComponent implements OnInit, OnDestroy {
  @Output() viewEventClicked = new EventEmitter();

  latestEvent: Event | undefined;
  filteredEventList: any[] = [];
  eventList: Event[] = [];
  registeredEvents: Event[] = [];

  loading: boolean = false;
  maxChar: number = 100;
  p: number = 1;
  itemsPerPage: number = 6;
  registeredUsers: { [eventId: number]: number } = {};
  isDropdownOpen: boolean = false;

  private updateSubscription?: Subscription;

  constructor(
    private sanitizer: DomSanitizer,
    private eventService: EventService,
    private cdr: ChangeDetectorRef,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.fetchEvents(); // Initial fetch
    this.subscribeToUserEvents(); // Subscribe to user events
    this.startPolling(); // Start polling
  }

  ngOnDestroy(): void {
    if (this.updateSubscription) {
      this.updateSubscription.unsubscribe();
    }
  }

  subscribeToUserEvents(): void {
    this.eventService.getUserEvent().subscribe((res) => {
      console.log(res.payload);
      this.registeredEvents = res.payload;
      this.filterRegisteredEvents();
      this.cdr.markForCheck();
    });
  }

  fetchEvents(): void {
    this.loading = true;
    this.eventService.getAllEvents().subscribe({
      next: (result: any) => {
        console.log(result);
        if (result && Array.isArray(result)) {
          this.eventList = result.map((event) => ({
            ...event,
            event_start_date: new Date(event.event_start_date),
            event_end_date: new Date(event.event_end_date),
            event_registration_start: new Date(event.event_registration_start),
            event_registration_end: new Date(event.event_registration_end),
            categories: JSON.parse(event.categories),
            target_participants: JSON.parse(event.target_participants),
            event_image$: this.eventService.getEventImage(event.event_id).pipe(
              switchMap((imageResult) => {
                if (imageResult.size > 0) {
                  const url = URL.createObjectURL(imageResult);
                  return of(this.sanitizer.bypassSecurityTrustResourceUrl(url));
                } else {
                  return of(undefined);
                }
              })
            ),
          }));

          this.eventList.forEach((ev: any) => {
            this.fetchRegisteredUser(ev.event_id);
            console.log(ev.target_participants);
          });

          const currentDate = new Date();
          this.eventList = this.eventList.filter(
            (event) =>
              event.status !== 'done' &&
              event.event_registration_end >= currentDate
          );

          this.filteredEventList = this.eventList.filter(
            (event) =>
              !this.registeredEvents.some(
                (re) => re.event_id === event.event_id
              )
          );
          this.latestEvent =
            this.filteredEventList.length > 0
              ? this.filteredEventList[0]
              : undefined;

          this.cdr.markForCheck();

          this.p = 1;
        } else {
          console.error('Expected an array but got:', result);
        }
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Error fetching events:', err);
        this.loading = false;
      },
    });
  }

  startPolling(): void {
    this.updateSubscription = interval(5000) // Polling interval in milliseconds (1 minute in this example)
      .subscribe(() => {
        this.fetchEvents(); // Fetch events again
      });
  }

  toggleDropdown() {
    this.isDropdownOpen = !this.isDropdownOpen;
  }

  fetchRegisteredUser(eventId: number) {
    this.eventService.getRegisteredUser(eventId).subscribe((res: any) => {
      console.log(
        `Registered users for event ${eventId}: ${res.payload.length}`
      );
      this.registeredUsers[eventId] = res.payload.length;
      this.cdr.markForCheck();
    });
  }

  filterRegisteredEvents(): void {
    this.filteredEventList = this.eventList.filter(
      (event) =>
        !this.registeredEvents.some((re) => re.event_id === event.event_id)
    );
    this.latestEvent =
      this.filteredEventList.length > 0 ? this.filteredEventList[0] : undefined;
    this.cdr.markForCheck();
  }

  isUserRegisteredForLatestEvent(): boolean {
    return (
      !!this.latestEvent &&
      this.registeredEvents.some(
        (re) => re.event_id === this.latestEvent?.event_id
      )
    );
  }

  onClickButton(): void {
    this.router.navigate(['student/registeredeventhistory']);
  }

  openPreview(eventId: number) {
    let routePrefix = '/student/preview';
    if (routePrefix) {
      this.router.navigate([`${routePrefix}/${eventId}`]);
    }
  }

  truncateDescription(text: string, maxLength: number): string {
    return text && text.length > maxLength
      ? `${text.substring(0, maxLength)} ...`
      : text;
  }

  getFormattedTargetParticipants(participants: any[]): string {
    const groupedParticipants: { [key: string]: string[] } = {};

    participants.forEach((participant) => {
      if (!groupedParticipants[participant.department]) {
        groupedParticipants[participant.department] = [];
      }
      groupedParticipants[participant.department].push(participant.year_levels);
    });

    return Object.keys(groupedParticipants)
      .map((department) => {
        const years = groupedParticipants[department].join(', ');
        return `${department} - ${years}`;
      })
      .join(' | ');
  }

  // filterEvents(participationType: string): void {
  //   if (participationType === 'open') {
  //     this.filteredEventList = this.eventList.filter(
  //       (event) => event.participation_type === 'open'
  //     );
  //   } else if (participationType === 'selected') {
  //     this.filteredEventList = this.eventList.filter(
  //       (event) => event.participation_type === 'selected'
  //     );
  //   }
  //   // Optionally, you can update latestEvent if filtered list changes
  //   this.latestEvent =
  //     this.filteredEventList.length > 0 ? this.filteredEventList[0] : undefined;
  // }

  // resetFilter(): void {
  //   this.filteredEventList = [...this.eventList];
  //   this.latestEvent =
  //     this.filteredEventList.length > 0 ? this.filteredEventList[0] : undefined;
  // }
}
