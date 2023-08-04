export default class Utils {
  public static validPassword(password: any): boolean {
    return /^(?=.*\d)(?=.*[A-Z])[0-9a-zA-Z!@#$%^&*]{8,}$/.test(
      password
    );
  }

  public static validEmail(email: any): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  public static validUsername(username: string): boolean {
    return /^[A-Za-zÀ-ÖØ-öø-ÿ0-9\.\@\+\-\_]+$/.test(username);
  }
}
