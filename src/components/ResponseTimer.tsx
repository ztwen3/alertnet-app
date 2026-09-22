import React, { useState, useEffect } from 'react';
import { Clock, CheckCircle2, Timer } from 'lucide-react';
import { Alert } from '../types';

interface ResponseTimerProps {
  alert: Alert;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

/**
 * Live Stopwatch Timer component that calculates response and resolution duration
 * from when the alert is triggered until it is resolved/closed.
 */
export const ResponseTimer: React.FC<ResponseTimerProps> = ({
  alert,
  size = 'md',
  showLabel = true,
}) => {
  const [now, setNow] = useState<number>(Date.now());

  const isCompleted = alert.status === 'Completed';
  const isSeen = alert.status === 'Seen';

  // Extract created timestamp
  const startTime = alert.createdAt || Date.now();

  // If completed, compute final elapsed time
  let finalDurationMs: number | null = null;
  if (isCompleted) {
    if (alert.completedAtTimestamp && typeof alert.completedAtTimestamp === 'number') {
      finalDurationMs = Math.max(0, alert.completedAtTimestamp - startTime);
    } else {
      finalDurationMs = Math.max(0, (now > startTime ? now - startTime : 0));
    }
  }

  // Update live timer every second when active
  useEffect(() => {
    if (isCompleted) return;

    const interval = setInterval(() => {
      setNow(Date.now());
    }, 1000);

    return () => clearInterval(interval);
  }, [isCompleted]);

  const elapsedMs = isCompleted && finalDurationMs !== null ? finalDurationMs : Math.max(0, now - startTime);
  const totalSeconds = Math.floor(elapsedMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const hours = Math.floor(minutes / 60);
  const displayMinutes = minutes % 60;

  const formattedTime = hours > 0
    ? `${hours}:${displayMinutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
    : `${displayMinutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

  // Color dynamics based on response duration:
  // Under 2 mins: Emerald / Green (Good SLA)
  // 2 - 5 mins: Amber / Orange (Warning)
  // Over 5 mins: Red / Urgent (Critical delay)
  const isGood = minutes < 2;
  const isWarning = minutes >= 2 && minutes < 5;
  const isCritical = minutes >= 5;

  let colorClasses = 'bg-red-500/15 border-red-500/30 text-red-400';
  if (isCompleted) {
    colorClasses = 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300';
  } else if (isSeen) {
    colorClasses = 'bg-blue-500/15 border-blue-500/30 text-blue-300';
  } else if (isGood) {
    colorClasses = 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400';
  } else if (isWarning) {
    colorClasses = 'bg-amber-500/15 border-amber-500/30 text-amber-300';
  } else if (isCritical) {
    colorClasses = 'bg-red-600/25 border-red-500/50 text-red-300 animate-pulse';
  }

  const badgeSize = size === 'lg' 
    ? 'px-3 py-1.5 text-sm' 
    : size === 'sm' 
    ? 'px-2 py-0.5 text-[11px]' 
    : 'px-2.5 py-1 text-xs';

  return (
    <div 
      className={`inline-flex items-center gap-1.5 rounded-xl border font-mono font-bold tracking-wider shadow-sm ${colorClasses} ${badgeSize}`}
      title={isCompleted ? `مدة إغلاق البلاغ: ${formattedTime}` : `الوقت المنقضي منذ إطلاق البلاغ: ${formattedTime}`}
    >
      {isCompleted ? (
        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
      ) : (
        <Timer className={`w-3.5 h-3.5 shrink-0 ${!isCompleted ? 'animate-spin' : ''}`} style={{ animationDuration: '4s' }} />
      )}

      {showLabel && (
        <span className="text-[10px] font-sans font-medium text-gray-300 ml-0.5">
          {isCompleted ? 'مدة الحل:' : 'وقت الاستجابة:'}
        </span>
      )}

      <span className="font-extrabold text-white font-mono">
        {formattedTime}
      </span>
    </div>
  );
};
