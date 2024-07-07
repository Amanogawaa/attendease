import { Component } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthserviceService } from '../../../core/service/authservice.service';
import Swal from 'sweetalert2';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [RouterLink, ReactiveFormsModule, CommonModule],
  templateUrl: './signup.component.html',
  styleUrl: './signup.component.css',
})
export class SignupComponent {
  emailInvalid: boolean = false;

  constructor(
    private builder: FormBuilder,
    private service: AuthserviceService,
    private router: Router
  ) {}

  registerForm = this.builder.group({
    first_name: this.builder.control('', Validators.required),
    last_name: this.builder.control('', Validators.required),
    email: this.builder.control('', Validators.compose([Validators.required])),
    year_level: this.builder.control('', Validators.required),
    course: this.builder.control('', Validators.required),
    block: this.builder.control('', Validators.required),
    password: this.builder.control('', Validators.required),
  });

  registerStudent(): void {
    if (this.registerForm.valid) {
      this.service.registerStudent(this.registerForm.value).subscribe(
        (result) => {
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
            title: 'Registered in successfully',
          });
          this.router.navigate(['login']);
        },
        (error) => {
          Swal.fire('Warning', `${error.error.status.message}`, 'warning');
        }
      );
    } else {
      Swal.fire('Incomplete Data', 'Please fill in all fields', 'warning');
    }
  }
}
