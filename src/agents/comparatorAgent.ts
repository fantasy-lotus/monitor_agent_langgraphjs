// agents/comparatorAgent.ts
import { MonitorTarget } from "../types/schema";

// 根据监控目标和当前值判断是否触发通知
export const shouldTriggerNotification = (
  target: MonitorTarget,
  currentValue: number
): boolean => {
  if (target.direction === "above") {
    return currentValue > target.threshold;
  }
  if (target.direction === "below") {
    return currentValue < target.threshold;
  }
  return false;
};