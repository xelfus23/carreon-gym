import { request } from "../utils/request";

export class CheckInService {
  static async checkIn(qrData: string) {
    if (qrData !== "GYM:in") {
      throw new Error(
        "Invalid QR code. Please scan the gym entrance QR code.",
      );
    }

    return (
      await request(`/attendance/checkin`, {
        method: "POST",
        body: JSON.stringify({
          qr_data: qrData,
        }),
      })
    );
  }

  static async checkOut(qrData: string) {
    if (qrData !== "GYM:out") {
      throw new Error(
        "Invalid QR code. Please scan the gym entrance QR code.",
      );
    }
    return (
      await request(`/attendance/checkout`, {
        method: "POST",
        body: JSON.stringify({
          qr_data: qrData,
        }),
      })
    );
  }

  static async getSessionStatus() {
    return (await request(`/attendance/sessionStatus`)).data;
  }
}
