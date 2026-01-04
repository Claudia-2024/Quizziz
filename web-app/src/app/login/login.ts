import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../auth/auth.service';
@Component({
  selector: 'app-login',
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './login.html',
  styleUrls: ['./login.css']
})
export class Login implements OnInit {
  loginForm: FormGroup;
  isLoading = false;
  showPassword = false;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private auth: AuthService,
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      rememberMe: [false]
    });
  }

  ngOnInit(): void {

    const savedEmail = localStorage.getItem('rememberedEmail');
    const savedRememberMe = localStorage.getItem('rememberMe');

    if (savedEmail && savedRememberMe === 'true') {
      this.loginForm.patchValue({
        email: savedEmail,
        rememberMe: true
      });
    }
  }


  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  errorMsg: string | null = null;

  async onSubmit(): Promise<void> {
    if (this.loginForm.valid) {
      this.isLoading = true;
      this.errorMsg = null;

      const { email, password, rememberMe } = this.loginForm.value;


      if (rememberMe) {
        localStorage.setItem('rememberedEmail', email);
        localStorage.setItem('rememberMe', 'true');
      } else {

        localStorage.removeItem('rememberedEmail');
        localStorage.removeItem('rememberMe');
      }

      try {
        await this.auth.login(email, password);
        this.router.navigate(['/dashboard']);
      } catch (err: any) {
        this.errorMsg = err?.error?.error || err?.message || 'Login failed';
      } finally {
        this.isLoading = false;
      }
    } else {

      Object.keys(this.loginForm.controls).forEach(key => {
        const control = this.loginForm.get(key);
        control?.markAsTouched();
      });


      alert('Please fill all required fields correctly!');
    }
  }


  quickLogin(): void {
    this.loginForm.patchValue({
      email: 'admin@univ-yaounde.cm',
      password: 'admin123'
    });
    this.onSubmit();
  }


  clearForm(): void {
    this.loginForm.reset({
      email: '',
      password: '',
      rememberMe: false
    });
    localStorage.removeItem('rememberedEmail');
    localStorage.removeItem('rememberMe');
  }
}
