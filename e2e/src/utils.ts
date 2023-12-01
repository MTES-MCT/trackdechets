// https://stackoverflow.com/questions/6248666/how-to-generate-short-uid-like-ax4j9z-in-js
export const uid = () => {
  const firstPart = (Math.random() * 46656) | 0;
  const secondPart = (Math.random() * 46656) | 0;

  const firstPartNum = ("000" + firstPart.toString(36)).slice(-3);
  const secondPartNum = ("000" + secondPart.toString(36)).slice(-3);

  return firstPartNum + secondPartNum;
};
