import { CommonModule, JsonPipe } from '@angular/common';
import { Component, Inject, OnInit, ViewEncapsulation } from '@angular/core';
import {
  MAT_DIALOG_DATA,
  MatDialogContent,
  MatDialogRef,
} from '@angular/material/dialog';
import {
  AbstractControl,
  FormArray,
  FormBuilder,
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { EventService } from '../../../../core/service/event.service';
import Swal from 'sweetalert2';
import { TagComponent, TagInputModule } from 'ngx-chips';

@Component({
  selector: 'app-edit-event',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogContent,
    MatFormFieldModule,
    MatDatepickerModule,
    FormsModule,
    ReactiveFormsModule,
    JsonPipe,
    TagInputModule,
  ],
  templateUrl: './edit-event.component.html',
  styleUrls: ['./edit-event.component.css'],
  encapsulation: ViewEncapsulation.None,
})
export class EditEventComponent implements OnInit {
  eventId?: number;
  eventVal: any;
  eventForm: FormGroup;
  categoryControls: FormArray | undefined;

  constructor(
    private service: EventService,
    private builder: FormBuilder,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private dialogRef: MatDialogRef<EditEventComponent>
  ) {
    this.eventVal = data[0];
    console.log(this.eventVal);

    this.eventForm = this.builder.group({
      event_name: [this.eventVal.event_name, Validators.required],
      event_description: [this.eventVal.event_description, Validators.required],
      event_location: [this.eventVal.event_location, Validators.required],
      event_start_date: [this.eventVal.event_start_date, [Validators.required]],
      event_end_date: [this.eventVal.event_end_date, [Validators.required]],
      event_registration_start: [
        this.eventVal.event_registration_start,
        Validators.required,
      ],
      event_registration_end: [
        this.eventVal.event_registration_end,
        Validators.required,
      ],
      event_type: [this.eventVal.event_type, Validators.required],
      max_attendees: [this.eventVal.max_attendees, Validators.required],
      categories: [
        this.eventVal.categories ? JSON.parse(this.eventVal.categories) : [],
      ],
      organizer_name: [this.eventVal.organizer_name, Validators.required],
    });
  }

  ngOnInit(): void {
    if (this.eventVal) {
      this.eventForm.patchValue({
        event_name: this.eventVal.event_name,
        event_description: this.eventVal.event_description,
        event_location: this.eventVal.event_location,
        event_start_date: this.eventVal.event_start_date,
        event_end_date: this.eventVal.event_end_date,
        event_registration_start: this.eventVal.event_registration_start,
        event_registration_end: this.eventVal.event_registration_end,
        event_type: this.eventVal.event_type,
        max_attendees: this.eventVal.max_attendees,
        categories: this.eventVal.categories
          ? JSON.parse(this.eventVal.categories)
          : null,
        organizer_name: this.eventVal.organizer_name,
      });
    }
  }

  updateEvent() {
    if (this.eventForm.valid) {
      const formData = this.eventForm.value;

      this.service.editEvent(this.eventVal.event_id, formData).subscribe(
        (res) => {
          const Toast = Swal.mixin({
            toast: true,
            position: 'top-end',
            showConfirmButton: false,
            timer: 1500,
            timerProgressBar: true,
            didOpen: (toast) => {
              toast.onmouseenter = Swal.stopTimer;
              toast.onmouseleave = Swal.resumeTimer;
            },
          });
          Toast.fire({
            icon: 'success',
            title: 'Event updated.',
          });
          this.dialogRef.close();
        },
        (error) => {
          Swal.fire('Warning', `${error.error.status.message}`, 'warning');
        }
      );
    } else {
      Swal.fire('Failed', 'Invalid Form!', 'error');
    }
  }

  closeDialog() {
    this.dialogRef.close();
  }

  futureDateValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const currentDate = new Date();
      currentDate.setHours(0, 0, 0, 0);

      const selectedDate = new Date(control.value);
      selectedDate.setHours(0, 0, 0, 0);

      if (control.value && selectedDate < currentDate) {
        Swal.fire({
          icon: 'warning',
          title: 'Invalid Date',
          text: "You've entered a past date!",
        });
        return { pastDate: true };
      }
      return null;
    };
  }
}
