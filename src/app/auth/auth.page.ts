import { Component, OnInit } from '@angular/core';
import { AuthService, AuthResponseData } from './auth.service';
import { Router } from '@angular/router';
import { LoadingController, AlertController } from '@ionic/angular';
import { NgForm } from '@angular/forms';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-auth',
  templateUrl: './auth.page.html',
  styleUrls: ['./auth.page.scss'],
})
export class AuthPage implements OnInit {
  isLoading = false;

  constructor(
    private authService: AuthService,
    private router: Router,
    private loadingController: LoadingController,
    private alertController: AlertController
  ) { }

  isLoggedIn = true;

  ngOnInit() {
  }

  authenticate(email: string, password: string) {
    this.isLoading = true;
    this.loadingController.create({keyboardClose: true, message: 'loggin in...'}).then(loadingEl => {
      loadingEl.present();
      let authObs: Observable<AuthResponseData>;
      if(this.isLoggedIn){
        authObs = this.authService.login({ email, password });
      }
      else {
        authObs = this.authService.signup(email, password)
      }
      authObs.subscribe(
        resData => {
          console.log(resData);
          this.isLoading = false;
          loadingEl.dismiss();
          this.router.navigate(['/places/tabs/discover'])
        },
        errResponse => {
          loadingEl.dismiss();
          const code = errResponse.error.error.message;
          let message = 'could not sign you up. please try again';
          if (code === 'EMAIL_EXISTS') {
            message = 'This email address already exist';
          }
          else if(code === 'EMAIL_NOT_FOUND'){
            message ='email address could not be found'
          }
          else if( code === 'INVALID_PASSWORD'){
            message ='password is not correct.'
          }
          this.showAlert(message);
          console.log(errResponse);
        }
      );
    });
    // this.authService.login();

  }

  onSubmit(form: NgForm) {
    if (!form.value) {
      return;
    }

    const email = form.value.email;
    const password = form.value.password;
    console.log(email, password);
    this.authenticate(email, password);
    form.reset();
  } 

  onSwitchAuthMode() {
    this.isLoggedIn = !this.isLoggedIn;
  }

  showAlert(message: string) {
    this.alertController.create({
      header: 'Authentication failed',
      message,
      buttons: [{
        text: 'Okay'
      }]
    }).then(alertEl => alertEl.present());
  }
}
