import { Routes } from '@angular/router';
import { UserComponent } from './modules/user/user.component';
import { OrganizerComponent } from './modules/organizer/organizer.component';
import { AuthenGuard } from './core/authen.guard';
import { AdminComponent } from './modules/admin/admin.component';
import { RoleGuard } from './core/role.guard';
import { PagenotfoundComponent } from './shared/components/pagenotfound/pagenotfound.component';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full',
  },

  {
    path: 'login',
    loadComponent: () =>
      import('./auth/pages/login/login.component').then(
        (c) => c.LoginComponent
      ),
  },

  {
    path: 'student/signup',
    loadComponent: () =>
      import('./auth/pages/signup/signup.component').then(
        (c) => c.SignupComponent
      ),
  },

  {
    path: 'organizer/signup',
    loadComponent: () =>
      import('./auth/pages/org-signup/org-signup.component').then(
        (c) => c.OrgSignupComponent
      ),
  },

  {
    path: 'admin',
    component: AdminComponent,
    children: [
      {
        path: '',
        redirectTo: 'admin-dashboard',
        pathMatch: 'full',
      },

      {
        path: 'admin-dashboard',
        loadComponent: () =>
          import(
            './modules/admin/pages/admin-dashboard/admin-dashboard.component'
          ).then((c) => c.AdminDashboardComponent),
        canActivate: [AuthenGuard],
      },

      {
        path: 'admin-event-list',
        loadComponent: () =>
          import('./modules/admin/pages/approval/approval.component').then(
            (c) => c.ApprovalComponent
          ),
        canActivate: [AuthenGuard],
      },

      {
        path: 'admin-attendees-list',
        loadComponent: () =>
          import(
            './modules/admin/pages/studentlist/studentlist.component'
          ).then((c) => c.StudentlistComponent),
        canActivate: [AuthenGuard],
      },

      {
        path: 'admin-event-report',
        loadComponent: () =>
          import(
            './modules/admin/pages/event-report-page/event-report-page.component'
          ).then((e) => e.EventReportPageComponent),
        children: [
          {
            path: 'report/:id',
            loadComponent: () =>
              import('./modules/admin/components/report/report.component').then(
                (e) => e.ReportComponent
              ),
          },
        ],
        canActivate: [AuthenGuard],
      },

      {
        path: 'admin-attendance',
        loadComponent: () =>
          import('./modules/admin/pages/attendance/attendance.component').then(
            (c) => c.AttendanceComponent
          ),
        canActivate: [AuthenGuard],
      },

      {
        path: 'admin-view-attendance/:eventId',
        loadComponent: () =>
          import(
            './modules/admin/components/markattendancee/markattendancee.component'
          ).then((c) => c.MarkattendanceeComponent),
        canActivate: [AuthenGuard],
      },

      {
        path: 'admin-feedback-list',
        loadComponent: () =>
          import(
            './modules/admin/pages/feedback-page/feedback-page.component'
          ).then((c) => c.FeedbackPageComponent),
        canActivate: [RoleGuard],
      },

      {
        path: 'admin-per-feedback/:eventId',

        loadComponent: () =>
          import(
            './shared/components/feedback-list/feedback-list.component'
          ).then((c) => c.FeedbackListComponent),
        canActivate: [RoleGuard],
      },

      {
        path: 'admin-user-feedback/:eventId/:userId',
        loadComponent: () =>
          import(
            './shared/components/view-user-feedback/view-user-feedback.component'
          ).then((c) => c.ViewUserFeedbackComponent),
        canActivate: [RoleGuard],
      },

      {
        path: 'admin-approval/:eventId',
        loadComponent: () =>
          import(
            './modules/admin/components/approval-page/approval-page.component'
          ).then((c) => c.ApprovalPageComponent),
      },
    ],
  },

  {
    path: 'student',
    component: UserComponent,
    children: [
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full',
      },

      {
        path: 'dashboard',
        loadComponent: () =>
          import('./modules/user/pages/dashboard/dashboard.component').then(
            (c) => c.DashboardComponent
          ),

        canActivate: [AuthenGuard],
      },

      {
        path: 'events',
        loadComponent: () =>
          import('./modules/user/pages/events/events.component').then(
            (c) => c.EventsComponent
          ),
        canActivate: [AuthenGuard],
      },

      {
        path: 'preview/:eventId',
        loadComponent: () =>
          import('./modules/user/components/preview/preview.component').then(
            (c) => c.PreviewComponent
          ),
        canActivate: [AuthenGuard],
      },

      {
        path: 'profile',
        loadComponent: () =>
          import('./modules/user/pages/profile/profile.component').then(
            (c) => c.ProfileComponent
          ),

        canActivate: [AuthenGuard],
      },

      {
        path: 'attendance',
        loadComponent: () =>
          import('./modules/user/pages/attendance/attendance.component').then(
            (c) => c.AttendanceComponent
          ),
        canActivate: [AuthenGuard],
      },

      {
        path: 'feedback',
        loadComponent: () =>
          import('./modules/user/pages/feedback/feedback.component').then(
            (c) => c.FeedbackComponent
          ),
        canActivate: [AuthenGuard],
      },

      {
        path: 'questionnaire/:eventId',
        loadComponent: () =>
          import(
            './modules/user/components/feedback-submission/feedback-submission.component'
          ).then((c) => c.FeedbackSubmissionComponent),
        canActivate: [AuthenGuard],
      },

      {
        path: 'registeredeventhistory',
        loadComponent: () =>
          import(
            './modules/user/components/eventhistory/eventhistory.component'
          ).then((c) => c.EventhistoryComponent),
        canActivate: [AuthenGuard],
      },
    ],
  },

  {
    path: 'organizer',
    component: OrganizerComponent,
    children: [
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full',
      },

      {
        path: 'dashboard',
        loadComponent: () =>
          import(
            './modules/organizer/pages/org-dashboard/org-dashboard.component'
          ).then((c) => c.OrgDashboardComponent),
        canActivate: [AuthenGuard],
      },

      {
        path: 'events',
        loadComponent: () =>
          import(
            './modules/organizer/pages/org-event/org-event.component'
          ).then((c) => c.OrgEventComponent),
        canActivate: [AuthenGuard],
      },

      {
        path: 'events-report',
        loadComponent: () =>
          import(
            './modules/organizer/pages/report-page/report-page.component'
          ).then((c) => c.ReportPageComponent),
        children: [
          {
            path: 'report/:id',
            loadComponent: () =>
              import(
                './modules/organizer/components/report/report.component'
              ).then((e) => e.ReportComponent),
          },
        ],
        canActivate: [AuthenGuard],
      },

      {
        path: 'event-certificate',
        loadComponent: () =>
          import('./modules/organizer/pages/certpage/certpage.component').then(
            (c) => c.CertpageComponent
          ),
        children: [
          {
            path: 'certification/:id',
            loadComponent: () =>
              import(
                './shared/components/certificate/certificate.component'
              ).then((c) => c.CertificateComponent),
          },
        ],
        canActivate: [AuthenGuard],
      },

      {
        path: 'attendance-submissions',
        loadComponent: () =>
          import(
            './modules/organizer/pages/attendance-page/attendance-page.component'
          ).then((c) => c.AttendancePageComponent),
        canActivate: [AuthenGuard],
      },

      {
        path: 'events-preview/:eventId',
        loadComponent: () =>
          import(
            './modules/organizer/components/eventpreview/eventpreview.component'
          ).then((c) => c.EventpreviewComponent),
        canActivate: [AuthenGuard],
      },

      {
        path: 'org-feedback-list',
        loadComponent: () =>
          import(
            './modules/organizer/pages/feedback-page/feedback-page.component'
          ).then((c) => c.FeedbackPageComponent),
        canActivate: [RoleGuard],
      },

      {
        path: 'org-per-feedback/:eventId',
        loadComponent: () =>
          import(
            './shared/components/feedback-list/feedback-list.component'
          ).then((c) => c.FeedbackListComponent),
        canActivate: [RoleGuard],
      },

      {
        path: 'org-user-feedback/:eventId/:userId',
        loadComponent: () =>
          import(
            './shared/components/view-user-feedback/view-user-feedback.component'
          ).then((c) => c.ViewUserFeedbackComponent),
        canActivate: [RoleGuard],
      },

      {
        path: 'organizer-view-attendance/:eventId',
        loadComponent: () =>
          import(
            './modules/admin/components/markattendancee/markattendancee.component'
          ).then((c) => c.MarkattendanceeComponent),
        canActivate: [AuthenGuard],
      },
    ],
  },

  {
    path: '**',
    component: PagenotfoundComponent,
  },
];
