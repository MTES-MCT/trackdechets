export const localAuthService = {
  isAuthenticated: false,
  locallyAutheticate(token: string) {
    this.isAuthenticated = true;
    window.localStorage.setItem("td-token", token);
  },
  locallySignOut() {
    this.isAuthenticated = false;
    window.localStorage.removeItem("td-token");
  },
  init() {
    if (window.localStorage.getItem("td-token")) {
      this.isAuthenticated = true;
    }
  }
};

localAuthService.init();
