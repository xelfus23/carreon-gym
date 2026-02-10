
import React, { useState } from 'react';
import { MOCK_MEMBERS } from '../constants';
import { chatService } from '../services/chatService';
import type { Member } from '../types';

const MemberManagement: React.FC = () => {
  const [members] = useState<Member[]>(MOCK_MEMBERS);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [insight, setInsight] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentState, setCurrentState] = useState('');

  const fetchInsight = async (member: Member) => {
    setSelectedMember(member);
    setIsLoading(true);
    setInsight('');
    setCurrentState('Initializing session...');
    
    try {
      const session = await chatService.createChat();
      const prompt = `Provide a quick summary and 3 motivational tips for a gym member named ${member.name} who has a ${member.attendanceRate}% attendance rate on a ${member.plan} plan. Keep it professional and encouraging.`;
      
      await chatService.sendMessage(
        session.id,
        prompt,
        (token) => {
          setInsight(prev => prev + token);
        },
        (state) => {
          setCurrentState(state);
        }
      );
    } catch (error) {
      console.error("Insight Error:", error);
      setInsight("Failed to connect to the backend at 192.168.1.150. Ensure the WebSocket server is running.");
    } finally {
      setIsLoading(false);
      setCurrentState('');
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-8 animate-in slide-in-from-bottom-4 duration-500">
      <div className="flex-1 bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <h3 className="text-lg font-bold text-slate-800">Member Directory</h3>
          <div className="relative">
            <input 
              type="text" 
              placeholder="Search members..." 
              className="pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
            />
            <span className="absolute left-3 top-2.5 text-slate-400">🔍</span>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-xs font-bold uppercase tracking-wider">
                <th className="px-6 py-4">Name</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Plan</th>
                <th className="px-6 py-4">Attendance</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {members.map((m) => (
                <tr key={m.id} className="hover:bg-slate-50/80 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="font-semibold text-slate-900">{m.name}</div>
                    <div className="text-xs text-slate-500">{m.email}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${
                      m.status === 'Active' ? 'bg-emerald-100 text-emerald-700' :
                      m.status === 'Pending' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'
                    }`}>
                      {m.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600">{m.plan}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-slate-100 h-1.5 rounded-full overflow-hidden max-w-[80px]">
                        <div 
                          className={`h-full rounded-full ${m.attendanceRate > 80 ? 'bg-emerald-500' : m.attendanceRate > 50 ? 'bg-amber-500' : 'bg-rose-500'}`}
                          style={{ width: `${m.attendanceRate}%` }}
                        ></div>
                      </div>
                      <span className="text-xs font-medium text-slate-700">{m.attendanceRate}%</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button 
                      onClick={() => fetchInsight(m)}
                      disabled={isLoading}
                      className="text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors opacity-0 group-hover:opacity-100 disabled:opacity-50"
                    >
                      AI Insight
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="lg:w-80 space-y-6">
        <div className="bg-indigo-600 rounded-3xl p-6 text-white shadow-xl shadow-indigo-200">
          <h4 className="text-lg font-bold mb-4 flex items-center gap-2">
            <span>✨</span> Member Coach AI
          </h4>
          {selectedMember ? (
            <div className="space-y-4">
              <div className="pb-4 border-b border-indigo-500/50">
                <p className="text-xs text-indigo-200 font-bold uppercase">Target Member</p>
                <p className="text-lg font-bold">{selectedMember.name}</p>
              </div>
              <div className="text-sm leading-relaxed text-indigo-50 bg-indigo-700/50 p-4 rounded-2xl min-h-[100px]">
                {isLoading && !insight ? (
                  <div className="flex flex-col gap-2 items-center py-4">
                    <div className="w-8 h-8 border-4 border-white/20 border-t-white rounded-full animate-spin"></div>
                    <span className="text-xs animate-pulse">{currentState || 'Connecting...'}</span>
                  </div>
                ) : (
                  <div className="whitespace-pre-line">{insight}</div>
                )}
                {isLoading && insight && (
                   <span className="inline-block w-1.5 h-4 bg-indigo-300 ml-1 animate-pulse"></span>
                )}
              </div>
              <button 
                className="w-full py-3 bg-white text-indigo-600 font-bold rounded-xl hover:bg-indigo-50 transition-colors shadow-sm disabled:opacity-50"
                onClick={() => alert(`Sending email to ${selectedMember.email}...`)}
                disabled={isLoading || !insight}
              >
                Send Motivational Email
              </button>
            </div>
          ) : (
            <div className="text-center py-12 px-4 border-2 border-dashed border-indigo-400 rounded-2xl bg-indigo-500/20">
              <p className="text-sm text-indigo-100">Select a member to generate personalized coaching insights.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MemberManagement;
