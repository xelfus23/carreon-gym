import { avatarColor } from "../../constants";

interface NewMember {
  name: string;
  plan_name: string;
  created_at: string;
  initials: string;
  verified: boolean;
}

const timeAgo = (dateStr: string): string => {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
};

const MemberRow: React.FC<{ member: NewMember; index: number }> = ({
  member,
  index,
}) => (
  <div
    className={`flex items-center gap-3 py-3 ${index !== 0 ? "border-t border-border" : ""
      }`}
  >
    <div
      className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${avatarColor(member.initials)}`}
    >
      {member.initials}
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-sm font-semibold text-text-primary truncate">
        {member.name}
      </p>
      <p className="text-xs text-text-secondary">
        {member.plan_name || "No plan"}
      </p>
    </div>
    <div className="text-right shrink-0">
      <p
        className={`text-xs font-semibold ${member.verified ? "text-emerald-400" : "text-amber-400"
          }`}
      >
        {member.verified ? "Verified" : "Unverified"}
      </p>
      <p className="text-xs text-text-secondary mt-0.5">
        {timeAgo(member.created_at)}
      </p>
    </div>
  </div>
);


export default MemberRow