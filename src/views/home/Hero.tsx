import { css } from "@emotion/react";
import styled from "@emotion/styled";
import moment from "moment";

// Append a timestamp to the image URL to avoid caching.
const timeStamp = moment().format("YYYY-MM-DD");

const mediaQueryGrow = css`
  /* Grow the hero image when resizing the window: */
  transition: height 200ms ease-out;

  @media (width > 1000px) {
    height: 240px;
  }
  @media (width > 1150px) {
    height: 280px; /* 40px*/
  }
  @media (width > 1400px) {
    height: 320px; /* 40px*/
  }
`;

const Hero = styled.div`
  width: 100%;
  height: 200px;
  background-color: black;
  background-position: center top;
  background-size: 100% auto;
  image-rendering: optimizeQuality;
  background-image: url(https://cdn.cloudflare.steamstatic.com/steam/apps/1151340/library_hero.jpg?t=${timeStamp});

  ${mediaQueryGrow}
`;

export default Hero;
