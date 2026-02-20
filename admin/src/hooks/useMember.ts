import { useEffect, useState } from "react";
import { memberService } from "../services/memberService";
import type { AdminMemberListItem } from "../types";

export const useMember = () => {
    const [members, setMembers] = useState<AdminMemberListItem[]>([]);

    useEffect(() => {
        const fetchMember = async () => {
            try {
                const result = await memberService.getMember();
                setMembers(result.data);
            } catch (err) {
                if (err instanceof Error) {
                    console.log(err.message);
                }
            }
        };

        fetchMember();
    }, []);

    return {
        members,
    };
};
