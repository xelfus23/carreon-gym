export default function SectionLabel({
    children,
    optional,
}: {
    children: React.ReactNode;
    optional?: boolean;
}) {
    return (
        <p className="text-[11px] font-bold uppercase tracking-widest text-text-secondary flex items-center gap-1">
            {children}
            {optional && (
                <span className="font-normal normal-case tracking-normal text-text-secondary/50">
                    (optional)
                </span>
            )}
        </p>
    );
}
