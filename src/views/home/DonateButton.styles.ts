import { css, keyframes } from "@emotion/react";
import { platform } from "@tauri-apps/plugin-os";

// Avoid broken animation loop in WebKit/WebKitGTK (present on Linux and MacOS).
const isBrokenWebkit = ["linux", "macos"].includes(platform());
// const isBrokenWebkit =
//   /^Linux/.test(window.navigator.platform) ||
//   /^Mac/.test(window.navigator.platform);
const animationIterationCount = isBrokenWebkit ? "1" : "infinite";

const donateButton = css`
  margin: 10px 0;
  transition: all ease 0.15s;
  &:hover {
    filter: brightness(1.2);
    cursor: pointer;
  }
`;

const heart = css`
  position: absolute;
  top: 20px;
  left: 50%;
  transform: translate(-50%, -50%);
  color: red;
  z-index: -1;
`;

const moveup = keyframes`
  from {
    top: 20px;
    left: 50%;
    opacity: 0.9;
  }
  to {
    top: -70px;
    left: 45%;
    opacity: 0;
  }
`;

const movetopright = keyframes`
  0% {
    top: 20px;
    left: 70%;
    opacity: 0.9;
  }
  100% {
    top: -30px;
    left: 90%;
    opacity: 0;
  }
`;

const movetopleft = keyframes`
  0% {
    top: 20px;
    left: 30%;
    opacity: 0.9;
  }
  100% {
    top: -30px;
    left: 10%;
    opacity: 0;
  }
`;

const moveleft = keyframes`
  0% {
    top: 20px;
    left: 20%;
    opacity: 0.9;
  }
  100% {
    top: -50px;
    left: 10%;
    opacity: 0;
  }
`;

const moveright = keyframes`
  0% {
    top: 20px;
    left: 70%;
    opacity: 0.9;
  }
  100% {
    top: -50px;
    left: 80%;
    opacity: 0;
  }
`;

const animateTopLeft = css`
  ${heart}
  animation: ${movetopleft} 2s ${animationIterationCount};
  animation-delay: 0s;
`;

const animateLeft = css`
  ${heart}
  animation: ${moveleft} 2s ${animationIterationCount};
  animation-delay: 0.75s;
`;

const animateTopRight = css`
  ${heart}
  animation: ${movetopright} 2s ${animationIterationCount};
  animation-delay: 0.25s;
`;

const animateRight = css`
  ${heart}
  animation: ${moveright} 2s ${animationIterationCount};
  animation-delay: 0.5s;
`;

const animateUp = css`
  ${heart}
  animation: ${moveup} 2s ${animationIterationCount};
  animation-delay: 0.5s;
`;

export default {
  donateButton,
  heart: {
    animateTopLeft,
    animateLeft,
    animateTopRight,
    animateRight,
    animateUp,
  },
};
