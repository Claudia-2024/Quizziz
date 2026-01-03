import { Component} from '@angular/core';
import { RouterOutlet, RouterLink } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faBell, faUser, faChevronDown, faPlus, faFilter, faSearch, faEdit, faTrash, faEye, faAngleDoubleLeft, faChevronLeft, faChevronRight, faAngleDoubleRight } from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'app-root',
  imports: [FontAwesomeModule, RouterOutlet],
  template: `<router-outlet></router-outlet>`
})
export class AppComponent {
  // Define icons
  faBell = faBell;
  faUser = faUser;
  faChevronDown = faChevronDown;
  faPlus = faPlus;
  faFilter = faFilter;
  faSearch = faSearch;
  faEdit = faEdit;
  faTrash = faTrash;
  faEye = faEye;
  faAngleDoubleLeft = faAngleDoubleLeft;
  faChevronLeft = faChevronLeft;
  faChevronRight = faChevronRight;
  faAngleDoubleRight = faAngleDoubleRight;
}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink],
  template: `<router-outlet></router-outlet>`
})
export class App {
  //protected readonly title = signal('Quizzy');
}
