export const formatDuration = (totalMinutes: number) => {
  if (!totalMinutes || totalMinutes <= 0) return "00 : 00 : 00";

  // Convert minutes to total seconds
  const totalSeconds = Math.floor(totalMinutes * 60);

  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const pad = (num: number) => num.toString().padStart(2, "0");

  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
};
