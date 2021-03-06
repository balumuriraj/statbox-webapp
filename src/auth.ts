// This import loads the firebase namespace along with all its type information.
import firebase from 'firebase/app';

// These imports load individual services into the firebase namespace.
import 'firebase/auth';
import firebaseui from 'firebaseui';

// Initialize Firebase
const config = {
  apiKey: 'AIzaSyCFNSA0vXoLEpkbgOvJzi6WWiHMcLjoSl8',
  authDomain: 'statbox89.firebaseapp.com',
  databaseURL: 'https://statbox89.firebaseio.com',
  projectId: 'statbox89',
  storageBucket: 'statbox89.appspot.com',
  messagingSenderId: '472325102202'
};

const init = (context: any) => {
  firebase.initializeApp(config);
  context.$store.dispatch('initialiseStore');
};

const initObserver = (context: any) => {
  firebase.auth().onAuthStateChanged((user) => {
    if (user) {
      // console.log('user logged in!');

      if (!context.$store.state.auth.token) {
        user.getIdToken(/* forceRefresh */ true).then((token) => {
          // Send token to your backend via HTTPS
          context.$store.dispatch('auth/setAuthUser', { token, user });
        }).catch((error) => {
          // Handle error
        });
      }
    } else {
      // console.log('user logged out!');
    }

    const requireAuth = context.$route.matched.some((record: any) => record.meta.requireAuth);

    if (requireAuth && !user) {
      context.$router.push('/');
    }
  });
};

const initUI = (container: any, context: any) => {
  let ui: any = null;
  const AuthUI = firebaseui.auth.AuthUI;

  if ((AuthUI as any).getInstance()) {
    ui = (AuthUI as any).getInstance();
  } else {
    ui = new AuthUI(firebase.auth());
  }

  const uiConfig: any = {
    signInSuccessUrl: '/',
    signInOptions: [
      firebase.auth.GoogleAuthProvider.PROVIDER_ID
      // firebase.auth.FacebookAuthProvider.PROVIDER_ID,
      // firebase.auth.EmailAuthProvider.PROVIDER_ID
    ],
    callbacks: {
      signInSuccessWithAuthResult(result: any, redirectUrl: string) {
        context.$store.dispatch('auth/closeModal');

        const isNewUser = result.additionalUserInfo.isNewUser;
        const name = result.additionalUserInfo.profile.given_name;
        const user = result.user;
        user.getIdToken(true).then((token: any) => {
          context.$store.dispatch('auth/setAuthUser', { token, user });
          context.$store.dispatch('notification/set', { message: `Welcome ${isNewUser ? '' : 'back'} ${name}` });
        });

        // Do not automatically redirect.
        return false;
      }
    },
    tosUrl: '/', // Terms of service url.
    privacyPolicyUrl: '/' // Privacy policy url.
  };

  ui.start(container, uiConfig);
};

const logout = async () => {
  await firebase.auth().signOut();
};

const getToken = async () => {
  const user = firebase.auth().currentUser;

  if (!user) {
    return null;
  }

  return await user.getIdToken();
};

const deleteUser = async (token: string) => {
  const user = firebase.auth().currentUser;

  try {
    await user.delete();
  } catch (error) {
    if (error.code === 'auth/requires-recent-login') {
      const credential = firebase.auth.GoogleAuthProvider.credential(token);
      await user.reauthenticateAndRetrieveDataWithCredential(credential);
      await user.delete();
    }
  }

};

export default { init, initObserver, initUI, logout, deleteUser, getToken };
