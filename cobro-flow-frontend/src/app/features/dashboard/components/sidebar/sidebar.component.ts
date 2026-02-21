import { Component, ChangeDetectionStrategy, input, output } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { NavItem, UserProfile, PlanInfo } from '../../models/dashboard.models';

@Component({
  selector: 'app-sidebar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, RouterLinkActive],
  template: `
    <aside class="sidebar">
      <div class="sidebar-top">
        <!-- Logo -->
        <div class="logo-area">
          <div class="logo-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 2L2 7l10 5 10-5-10-5z"/>
              <path d="M2 17l10 5 10-5"/>
              <path d="M2 12l10 5 10-5"/>
            </svg>
          </div>
          <span class="logo-text">CashFlow</span>
        </div>

        <!-- Navigation -->
        <nav class="nav-items">
          @for (item of navItems(); track item.id) {
            <a
              [routerLink]="item.route"
              routerLinkActive="active"
              [routerLinkActiveOptions]="{ exact: item.id === 'dashboard' }"
              class="nav-item"
            >
              <i [attr.data-lucide]="item.icon" class="nav-icon"></i>
              <span class="nav-label">{{ item.label }}</span>
              @if (item.badge) {
                <span class="nav-badge">{{ item.badge }}</span>
              }
            </a>
          }
        </nav>
      </div>

      <div class="sidebar-bottom">
        <!-- Help Button -->
        <button class="help-btn" (click)="onHelpClick.emit()">
          <i data-lucide="help-circle" class="help-icon"></i>
          <span>Ayuda y Soporte</span>
        </button>

        <!-- Plan Card -->
        <div class="plan-card">
          <div class="plan-header">
            <span class="plan-label">{{ planInfo().name }}</span>
            <span class="plan-percentage">{{ planInfo().percentage }}% del límite usado</span>
          </div>
          <div class="plan-progress">
            <div class="plan-progress-bar" [style.width.%]="planInfo().percentage"></div>
          </div>
          <button class="upgrade-btn" (click)="onUpgradeClick.emit()">
            {{ planInfo().upgradeLabel }}
          </button>
        </div>

        <!-- User Profile -->
        <div class="user-profile" (click)="onProfileClick.emit()">
          <div class="avatar" [style.background-color]="userProfile().avatarColor">
            {{ userProfile().initials }}
          </div>
          <div class="user-info">
            <span class="user-name">{{ userProfile().name }}</span>
            <span class="user-email">{{ userProfile().email }}</span>
          </div>
        </div>
      </div>
    </aside>
  `,
  styles: [`
    .sidebar {
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      width: 260px;
      min-width: 260px;
      height: 100vh;
      padding: 32px 20px;
      background: #ffffff;
      border-right: 1px solid #E5E7EB;
      position: sticky;
      top: 0;
      overflow-y: auto;
    }

    .sidebar-top {
      display: flex;
      flex-direction: column;
      gap: 32px;
    }

    .logo-area {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 0 4px;
    }

    .logo-icon {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 40px;
      height: 40px;
      background: linear-gradient(135deg, #1E40AF 0%, #3B82F6 100%);
      border-radius: 10px;
      color: white;
      box-shadow: 0 2px 8px rgba(30, 64, 175, 0.3);
    }

    .logo-text {
      font-family: 'Inter', sans-serif;
      font-size: 20px;
      font-weight: 700;
      color: #1F2937;
      letter-spacing: -0.3px;
    }

    .nav-items {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .nav-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 10px 16px;
      border-radius: 8px;
      text-decoration: none;
      color: #6B7280;
      font-family: 'Inter', sans-serif;
      font-size: 14px;
      font-weight: 500;
      transition: all 0.15s cubic-bezier(0.4, 0, 0.2, 1);

      &:hover {
        background: #F9FAFB;
        color: #1F2937;
      }

      &.active {
        background: #EFF6FF;
        color: #1E40AF;
        font-weight: 600;

        .nav-icon {
          color: #1E40AF;
        }
      }
    }

    .nav-icon {
      width: 20px;
      height: 20px;
      flex-shrink: 0;
    }

    .nav-label {
      flex: 1;
    }

    .nav-badge {
      padding: 2px 8px;
      background: #E5E7EB;
      border-radius: 12px;
      font-size: 12px;
      font-weight: 600;
      color: #6B7280;
      min-width: 24px;
      text-align: center;
    }

    .active .nav-badge {
      background: #DBEAFE;
      color: #1E40AF;
    }

    .sidebar-bottom {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .help-btn {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 12px;
      background: #F9FAFB;
      border: none;
      border-radius: 6px;
      color: #6B7280;
      font-family: 'Inter', sans-serif;
      font-size: 14px;
      cursor: pointer;
      transition: all 0.15s ease;

      &:hover {
        background: #F3F4F6;
        color: #1F2937;
      }
    }

    .help-icon {
      width: 18px;
      height: 18px;
    }

    .plan-card {
      display: flex;
      flex-direction: column;
      gap: 8px;
      padding: 16px;
      background: linear-gradient(135deg, #DBEAFE 0%, #BFDBFE 100%);
      border-radius: 10px;
    }

    .plan-header {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .plan-label {
      font-family: 'Inter', sans-serif;
      font-size: 14px;
      font-weight: 600;
      color: #1E40AF;
    }

    .plan-percentage {
      font-family: 'Inter', sans-serif;
      font-size: 12px;
      color: #3B82F6;
    }

    .plan-progress {
      height: 6px;
      background: rgba(255, 255, 255, 0.5);
      border-radius: 3px;
      overflow: hidden;
    }

    .plan-progress-bar {
      height: 100%;
      background: #1E40AF;
      border-radius: 3px;
      transition: width 0.5s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .upgrade-btn {
      padding: 8px 16px;
      background: #1E40AF;
      border: none;
      border-radius: 6px;
      color: white;
      font-family: 'Inter', sans-serif;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
      box-shadow: 0 1px 3px rgba(30, 64, 175, 0.3);

      &:hover {
        background: #1E3A8A;
        box-shadow: 0 2px 6px rgba(30, 64, 175, 0.4);
      }
    }

    .user-profile {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px;
      background: #F9FAFB;
      border-radius: 10px;
      cursor: pointer;
      transition: all 0.15s ease;

      &:hover {
        background: #F3F4F6;
      }
    }

    .avatar {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 40px;
      height: 40px;
      min-width: 40px;
      border-radius: 50%;
      color: white;
      font-family: 'Inter', sans-serif;
      font-size: 14px;
      font-weight: 600;
    }

    .user-info {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 2px;
      min-width: 0;
    }

    .user-name {
      font-family: 'Inter', sans-serif;
      font-size: 14px;
      font-weight: 600;
      color: #1F2937;
    }

    .user-email {
      font-family: 'Inter', sans-serif;
      font-size: 12px;
      color: #6B7280;
      text-overflow: ellipsis;
      overflow: hidden;
      white-space: nowrap;
    }
  `]
})
export class SidebarComponent {
  navItems = input.required<NavItem[]>();
  userProfile = input.required<UserProfile>();
  planInfo = input.required<PlanInfo>();

  onHelpClick = output<void>();
  onUpgradeClick = output<void>();
  onProfileClick = output<void>();
  onLogoutClick = output<void>();
}
