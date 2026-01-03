import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router'; 
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
    private router: Router 
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

  onSubmit(): void {
    if (this.loginForm.valid) {
      this.isLoading = true;

      const { email, rememberMe } = this.loginForm.value;

     
      if (rememberMe) {
        localStorage.setItem('rememberedEmail', email);
        localStorage.setItem('rememberMe', 'true');
      } else {
       
        localStorage.removeItem('rememberedEmail');
        localStorage.removeItem('rememberMe');
      }

     
      setTimeout(() => {
        this.isLoading = false;
        
       
        this.router.navigate(['/dashboard']);
        
       
        console.log('Login successful! Redirecting to dashboard...');
        console.log('Email:', email);
        
      }, 1000); 
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
      email: 'test@example.com',
      password: '123'
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