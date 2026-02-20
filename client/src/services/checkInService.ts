import { request } from "../utils/request";

export class CheckInService {
    static async checkIn(qrData: string) {
        if (qrData !== "GYM:main") {
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
        ).data;
    }

    static async checkOut() {
        return (await request(`/attendance/checkout`)).data;
    }

    static async getSessionStatus() {
        return (await request(`/attendance/sessionStatus`)).data;
    }
}
