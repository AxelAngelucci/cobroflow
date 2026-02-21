import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SidebarComponent } from './components/sidebar/sidebar.component';
import { DashboardService } from './services/dashboard.service';

@Component({
  selector: 'app-dashboard-layout',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet, SidebarComponent],
  template: `
    <div class="dashboard-layout">
      <app-sidebar
        [navItems]="dashboardService.navItems()"
        [userProfile]="dashboardService.userProfile()"
        [planInfo]="dashboardService.planInfo()"
        (onHelpClick)="handleHelpClick()"
        (onUpgradeClick)="handleUpgradeClick()"
        (onProfileClick)="handleProfileClick()"
        (onLogoutClick)="handleLogoutClick()"
      />
      <main class="dashboard-main">
        <router-outlet />
      </main>
    </div>
  `,
  styles: [`
    .dashboard-layout {
      display: flex;
      min-height: 100vh;
      background: #F9FAFB;
    }

    .dashboard-main {
      flex: 1;
      overflow-y: auto;
    }
  `]
})
export class DashboardLayoutComponent {
  protected readonly dashboardService = inject(DashboardService);

  handleHelpClick(): void {
    console.log('Help clicked');
    // Implement help functionality
  }

  handleUpgradeClick(): void {
    console.log('Upgrade clicked');
    // Implement upgrade functionality
  }

  handleProfileClick(): void {
    console.log('Profile clicked');
    // Implement profile functionality
  }

  handleLogoutClick(): void {
    this.dashboardService.logout();
  }
}
