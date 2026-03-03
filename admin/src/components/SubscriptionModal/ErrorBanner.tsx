export default function ErrorBanner({ message }: { message: string }) {
    return (
        <div className="flex items-start gap-3 bg-danger/10 border border-danger/20 rounded-2xl px-4 py-3">
            <span className="text-danger shrink-0 mt-px text-sm">⚠</span>
            <p className="text-sm text-danger leading-snug">{message}</p>
        </div>
    );
}
