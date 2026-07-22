const machineImages: Record<string, string> = {
  hopper: "/machines/hopper.webp",
  conveyor: "/machines/conveyor.webp",
  crusher: "/machines/crusher.webp",
  screen: "/machines/screen.webp",
};

export function getMachineImage(assetType: string) {
  return machineImages[assetType];
}
