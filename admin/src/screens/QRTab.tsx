import { QRCodeSVG } from "qrcode.react";

export default function QRTab() {
    return (
        <div className="h-full w-full flex flex-col space-y-4">
            <div className="bg-white p-2 w-fit">
                <QRCodeSVG value={"GYM:main"} size={500} />
            </div>
        </div>
    );
}
