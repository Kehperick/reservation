import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { BehaviorSubject, from } from 'rxjs';
import { User } from './user.model';
import { map, tap } from 'rxjs/operators';
import { Plugins} from '@capacitor/core';

export interface AuthResponseData {
  king: string;
  idToken: string;
  email: string;
  refreshToken: string;
  localId: string;
  expiresIn: string;
  registered?: boolean;
}
@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private _user = new BehaviorSubject<User>(null);
  private activeLogoutTimer: any;

  private _token = new BehaviorSubject<string>('');

  get userIsAuthenticated() {
    return this._user.asObservable().pipe(
      map(user => {
        if (user) {
        return !!user.token;
        }
        return false;
      })
    );
  }
  get token(){
    return this._user.asObservable().pipe(
      map(user => {
        if (user) {
        return user.token;
        }
        return null;
      })
    );
  }
  get userId() {
    return this._user.asObservable().pipe(
      map(user => {
        if (user) {
         return user.id;
        }
         else {
         return null;
        }

        })
    );
  }
  signup(email: string, password: string) {
    return this.http.post<AuthResponseData>(`https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${environment.firebaseAPIKey}`,
    {email:email, password: password, returnSecureToken: true}
    ).pipe(
      tap(
        this.setUserData.bind(this)
      )
    )
  }
  constructor(
    private http: HttpClient
  ) { }

  autoLogin(){
    return from(Plugins.Storage.get({key: 'authData'})).pipe(map(storedData =>{
      if(!storedData || !storedData.value){
        return null;
      }
      const parsedData = JSON.parse(storedData.value) as {token: string; tokenExpirationDate: string; userId: string,email:string}
      const expirationTime = new Date(parsedData.tokenExpirationDate);
      if(expirationTime <= new Date()){
        return null;
      }
      const user = new User(parsedData.userId, parsedData.email, parsedData.token, expirationTime)
      return user;
    }), tap(user =>{
      if(user){
        this._user.next(user);
        this.autoLogout(user.tokenDuration)
      }
    }),map(user =>{
      return !!user;
    })
    )};

    private autoLogout(duration: number){
      if(this.activeLogoutTimer){
        clearTimeout(this.activeLogoutTimer)
      }

      setTimeout(() =>{
        this.logout()
      },
        duration)
    }

  login({ email, password }: { email: string; password: string; }) {
    // tslint:disable-next-line: max-line-length
    return this.http.post<AuthResponseData>(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${environment.firebaseAPIKey}`,
    {email: email, password: password, returnSecureToken: true})
    .pipe(
      tap(
        this.setUserData.bind(this)
      )
    )
  }
  logout() {
    if(this.activeLogoutTimer){
      clearTimeout(this.activeLogoutTimer)
    }
    this._user.next(null);
    Plugins.Storage.remove({key: 'authData'})
  }

  private setUserData(authResponsData: AuthResponseData){
    const expirationTime = new Date(new Date().getTime() + (+authResponsData.expiresIn * 1000));
    const user = new User(
      authResponsData.localId, 
      authResponsData.email, 
      authResponsData.idToken, 
      expirationTime
      )
    this._user.next(user);
            this.autoLogout(user.tokenDuration)
    this.storeAuthData(authResponsData.localId, 
              authResponsData.idToken,
              expirationTime.toISOString(),
              authResponsData.email
              )
  }
  private storeAuthData(
    userId: string, 
    token: string, 
    tokenExpirationData:string,
    email: string
    ){
    const data =JSON.stringify({
      userId: userId, 
      token: token, 
      tokenExpirationData: tokenExpirationData, email: email})
    Plugins.Storage.set({key: 'authData', value: data})
  }
  ngOnDestroy(): void {
    //Called once, before the instance is destroyed.
    //Add 'implements OnDestroy' to the class.
    if(this.activeLogoutTimer){
      clearTimeout(this.activeLogoutTimer)
    }
  }
}
