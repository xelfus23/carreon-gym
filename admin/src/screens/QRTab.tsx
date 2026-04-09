import { QRCodeSVG } from "qrcode.react";

export default function QRTab() {
    return (
        <div className="h-full w-full flex gap-8 items-center justify-evenly">
            <div className="space-y-4">
                <h1 className="text-3xl text-center uppercase font-bold">In</h1>
                <div className="bg-white p-2 w-fit h-fit">
                    <QRCodeSVG value={"GYM:in"} size={300} />
                </div>
            </div>

            <div className="space-y-4">
                <h1 className="text-3xl text-center uppercase font-bold">
                    Out
                </h1>
                <div className="bg-white p-2 w-fit h-fit">
                    <QRCodeSVG value={"GYM:out"} size={300} />
                </div>
            </div>
        </div>
    );
}
