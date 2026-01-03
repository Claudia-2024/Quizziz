import { Routes } from '@angular/router';
import { Sidebar } from './sidebar/sidebar';
import { Courses } from './courses/courses';
import { Dashboard } from './dashboard/dashboard';
import { Students } from './student/student';
import { Teachers } from './teachers/teachers';
import { Test } from './test/test';
import { Classes } from './classes/classes';
import { LandingPage } from './landing-page/landing-page';
import { Login } from './login/login';


export const routes: Routes = [
   {path: "sidebar", component: Sidebar
     
   }, 
    {path: "login", component: Login  },
   {path: "courses", component: Courses  },

    {path: "dashboard", component: Dashboard },
     {path: "student", component: Students  },
      {path: "teachers", component: Teachers  },
       {path: "test", component: Test  },
        {path: "class", component: Classes  },
         {path: "", component: LandingPage  },

];
