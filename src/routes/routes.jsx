import DashboardOutlinedIcon from '@mui/icons-material/DashboardOutlined';
import MenuBookOutlinedIcon from '@mui/icons-material/MenuBookOutlined';
import PeopleOutlinedIcon from '@mui/icons-material/PeopleOutlined';
import MoveToInboxOutlinedIcon from '@mui/icons-material/MoveToInboxOutlined';
import HandshakeOutlinedIcon from '@mui/icons-material/HandshakeOutlined';
import FactCheckOutlinedIcon from '@mui/icons-material/FactCheckOutlined';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import AssessmentOutlinedIcon from '@mui/icons-material/AssessmentOutlined';
import ManageAccountsOutlinedIcon from '@mui/icons-material/ManageAccountsOutlined';
import AdminPanelSettingsOutlinedIcon from '@mui/icons-material/AdminPanelSettingsOutlined';
import AccountTreeOutlinedIcon from '@mui/icons-material/AccountTreeOutlined';
import { PERMISSIONS } from '@/constants/permissions';
import DashboardPage from '@/pages/dashboard/DashboardPage';
import CoursesPage from '@/pages/courses/CoursesPage';
import UsersPage from '@/pages/admin/UsersPage';
import RolesPage from '@/pages/admin/RolesPage';
import OrganisationPage from '@/pages/admin/OrganisationPage';
import ComingSoonPage from '@/pages/system/ComingSoonPage';

// EVERY page of the app is listed here, once. The sidebar menu is built from this same list,
// so adding a page and its menu item is one entry.
//   path:           the URL
//   permission:     what the user's role must allow (leave out: every logged-in user)
//   superAdminOnly: only the Super Admin (organisation-wide pages)
//   menu:           { label, icon, comingSoon?, admin? }  leave out for pages not in the sidebar;
//                   admin: true shows it under "Administration"
export const appRoutes = [
  {
    path: '/',
    element: <DashboardPage />,
    menu: { label: 'Dashboard', icon: DashboardOutlinedIcon },
  },
  {
    path: '/courses',
    element: <CoursesPage />,
    permission: PERMISSIONS.COURSE_READ,
    menu: { label: 'Courses', icon: MenuBookOutlinedIcon },
  },
  {
    // Opens the courses page with the "Add course" dialog: a write action with its own URL
    path: '/courses/new',
    element: <CoursesPage startWithAddDialog />,
    permission: PERMISSIONS.COURSE_WRITE,
  },

  // Placeholders: the interns replace each element with the real page
  {
    path: '/students',
    element: <ComingSoonPage title="Students" srsIds="STU-01 to STU-07, PRF-01, PRF-02" />,
    permission: PERMISSIONS.STUDENT_READ,
    menu: { label: 'Students', icon: PeopleOutlinedIcon, comingSoon: true },
  },
  {
    path: '/inward',
    element: <ComingSoonPage title="Inward" srsIds="INW-01 to INW-07" />,
    permission: PERMISSIONS.INWARD_READ,
    menu: { label: 'Inward', icon: MoveToInboxOutlinedIcon, comingSoon: true },
  },
  {
    path: '/handover',
    element: <ComingSoonPage title="Hand-over" srsIds="HND-01 to HND-08" />,
    permission: PERMISSIONS.HANDOVER_ISSUE,
    menu: { label: 'Hand-over', icon: HandshakeOutlinedIcon, comingSoon: true },
  },
  {
    path: '/clearance',
    element: <ComingSoonPage title="Clearance" srsIds="CLR-01 to CLR-05" />,
    permission: PERMISSIONS.CLEARANCE_VIEW,
    menu: { label: 'Clearance', icon: FactCheckOutlinedIcon, comingSoon: true },
  },
  {
    path: '/tc',
    element: <ComingSoonPage title="Transfer Certificates" srsIds="TC-01 to TC-08" />,
    permission: PERMISSIONS.TC_READ,
    menu: { label: 'TC', icon: DescriptionOutlinedIcon, comingSoon: true },
  },
  {
    path: '/reports',
    element: <ComingSoonPage title="Reports" srsIds="RPT-02 (P1), RPT-01, RPT-03 to RPT-05 (P2)" />,
    permission: PERMISSIONS.REPORT_VIEW,
    menu: { label: 'Reports', icon: AssessmentOutlinedIcon, comingSoon: true },
  },

  // Administration (ADR-016)
  {
    path: '/admin/users',
    element: <UsersPage />,
    permission: PERMISSIONS.USERS_MANAGE,
    menu: { label: 'Users', icon: ManageAccountsOutlinedIcon, admin: true },
  },
  {
    path: '/admin/roles',
    element: <RolesPage />,
    permission: PERMISSIONS.ROLES_MANAGE,
    menu: { label: 'Roles', icon: AdminPanelSettingsOutlinedIcon, admin: true },
  },
  {
    path: '/admin/organisation',
    element: <OrganisationPage />,
    superAdminOnly: true,
    menu: { label: 'Organisation', icon: AccountTreeOutlinedIcon, admin: true },
  },
];

// May this user open this route in the selected institute? Used by the menu and ProtectedRoute.
export function canOpen(route, { can, isSuperAdmin }) {
  if (route.superAdminOnly) return isSuperAdmin;
  return !route.permission || can(route.permission);
}
