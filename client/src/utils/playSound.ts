export function playSound(sound: string){

  const audio = new Audio(`/sounds/${sound}`);

  audio.volume = 1;

  audio.play().catch(() => {});
}