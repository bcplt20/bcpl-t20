// Shared load profiles — progressive by design (master prompt: "Do not
// immediately jump to extreme load"). Select with PROFILE env var.
export function profileStages() {
  const profile = (__ENV.PROFILE || "smoke").toLowerCase();
  switch (profile) {
    case "ramp": // progressive: 50 → 100 → 500 → 1000 VUs
      return [
        { duration: "2m", target: 50 },
        { duration: "3m", target: 50 },
        { duration: "2m", target: 100 },
        { duration: "3m", target: 100 },
        { duration: "3m", target: 500 },
        { duration: "5m", target: 500 },
        { duration: "3m", target: 1000 },
        { duration: "5m", target: 1000 },
        { duration: "3m", target: 0 },
      ];
    case "spike": // sudden 10x → 25x (autoscaling proof: watch scale-out + recovery)
      return [
        { duration: "3m", target: 40 },
        { duration: "30s", target: 400 },
        { duration: "4m", target: 400 },
        { duration: "30s", target: 1000 },
        { duration: "5m", target: 1000 },
        { duration: "5m", target: 40 },
        { duration: "2m", target: 0 },
      ];
    case "soak": // sustained medium load — finds leaks/credit exhaustion
      return [
        { duration: "5m", target: 200 },
        { duration: "60m", target: 200 },
        { duration: "5m", target: 0 },
      ];
    case "smoke":
    default:
      return [
        { duration: "30s", target: 5 },
        { duration: "1m", target: 5 },
        { duration: "30s", target: 0 },
      ];
  }
}
