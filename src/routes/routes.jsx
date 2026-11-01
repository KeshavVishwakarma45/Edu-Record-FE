import DashboardOutlinedIcon from '@mui/icons-material/DashboardOutlined';
import MenuBookOutlinedIcon from '@mui/icons-material/MenuBookOutlined';
import PeopleOutlinedIcon from '@mui/icons-material/PeopleOutlined';
import MoveToInboxOutlinedIcon from '@mui/icons-material/MoveToInboxOutlined';
import HandshakeOutlinedIcon from '@mui/icons-material/HandshakeOutlined';
import FactCheckOutlinedIcon from '@mui/icons-material/FactCheckOutlined';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import AssessmentOutlinedIcon from '@mui/icons-material/AssessmentOutlined';
import { ROLES, ALL_ROLES, STAFF_ROLES, COURSE_WRITE_ROLES } from '@/constants/roles';
import DashboardPage from '@/pages/dashboard/DashboardPage';
import CoursesPage from '@/pages/courses/CoursesPage';
import ComingSoonPage from '@/pages/system/ComingSoonPage';

const { SOCIETY_ADMIN, PRINCIPAL, EXAM_CLERK, TC_CLERK, ACCOUNTS, DEPT_INCHARGE } = ROLES;

// EVERY page of the app is listed here, once. The sidebar menu is built from this same list,
// so adding a page and its menu item is one entry.
//   path:  the URL
//   roles: who may open it (others see the "No access" page)
//   menu:  { label, icon, comingSoon? }  leave out for pages that are not in the sidebar
export const appRoutes = [
  {
    path: '/',
    element: <DashboardPage />,
    roles: ALL_ROLES,
    menu: { label: 'Dashboard', icon: DashboardOutlinedIcon },
  },
  {
    path: '/courses',
    element: <CoursesPage />,
    roles: STAFF_ROLES,
    menu: { label: 'Courses', icon: MenuBookOutlinedIcon },
  },
  {
    // Opens the courses page with the "Add course" dialog: a write action with its own URL
    path: '/courses/new',
    element: <CoursesPage startWithAddDialog />,
    roles: COURSE_WRITE_ROLES,
  },

  // Placeholders: the interns replace each element with the real page (roles from the SRS)
  {
    path: '/students',
    element: <ComingSoonPage title="Students" srsIds="STU-01 to STU-07, PRF-01, PRF-02" />,
    roles: STAFF_ROLES,
    menu: { label: 'Students', icon: PeopleOutlinedIcon, comingSoon: true },
  },
  {
    path: '/inward',
    element: <ComingSoonPage title="Inward" srsIds="INW-01 to INW-07" />,
    roles: [SOCIETY_ADMIN, PRINCIPAL, EXAM_CLERK],
    menu: { label: 'Inward', icon: MoveToInboxOutlinedIcon, comingSoon: true },
  },
  {
    path: '/handover',
    element: <ComingSoonPage title="Hand-over" srsIds="HND-01 to HND-08" />,
    roles: [SOCIETY_ADMIN, PRINCIPAL, EXAM_CLERK, TC_CLERK],
    menu: { label: 'Hand-over', icon: HandshakeOutlinedIcon, comingSoon: true },
  },
  {
    path: '/clearance',
    element: <ComingSoonPage title="Clearance" srsIds="CLR-01 to CLR-05" />,
    roles: [SOCIETY_ADMIN, PRINCIPAL, TC_CLERK, ACCOUNTS, DEPT_INCHARGE],
    menu: { label: 'Clearance', icon: FactCheckOutlinedIcon, comingSoon: true },
  },
  {
    path: '/tc',
    element: <ComingSoonPage title="Transfer Certificates" srsIds="TC-01 to TC-08" />,
    roles: [SOCIETY_ADMIN, PRINCIPAL, TC_CLERK],
    menu: { label: 'TC', icon: DescriptionOutlinedIcon, comingSoon: true },
  },
  {
    path: '/reports',
    element: <ComingSoonPage title="Reports" srsIds="RPT-02 (P1), RPT-01, RPT-03 to RPT-05 (P2)" />,
    roles: [SOCIETY_ADMIN, PRINCIPAL],
    menu: { label: 'Reports', icon: AssessmentOutlinedIcon, comingSoon: true },
  },
];
