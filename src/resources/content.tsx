import { Album, Gallery, Person, Social } from "@/types";

const person: Person = {
  firstName: "Lê Tấn",
  lastName: "Triển",
  name: "Lê Tấn Triển",
  role: "Photographer",
  avatar: "/images/avatar.jpg",
  email: "letantrien@example.com",
};

const social: Social = [
  {
    name: "LinkedIn",
    icon: "linkedin",
    link: "https://linkedin.com/in/letantrien",
  },
  {
    name: "facebook",
    icon: "facebook",
    link: "https://www.facebook.com/trien.le.716533",
  },
];

const album: Album = {
  path: "/album",
  label: "Album",
  title: `Photo Albums – ${person.name}`,
  description: "My photo album collections",
};

const gallery: Gallery = {
  path: "/gallery",
  label: "Gallery",
  title: `Photo Gallery – ${person.name}`,
  description: `A photo collection by ${person.name}`,
  images: [
    {
      src: "/images/gallery/horizontal-1.jpg",
      alt: "image",
      orientation: "horizontal",
    },
    {
      src: "/images/gallery/vertical-4.jpg",
      alt: "image",
      orientation: "vertical",
    },
    {
      src: "/images/gallery/horizontal-3.jpg",
      alt: "image",
      orientation: "horizontal",
    },
    {
      src: "/images/gallery/vertical-1.jpg",
      alt: "image",
      orientation: "vertical",
    },
    {
      src: "/images/gallery/vertical-2.jpg",
      alt: "image",
      orientation: "vertical",
    },
    {
      src: "/images/gallery/horizontal-2.jpg",
      alt: "image",
      orientation: "horizontal",
    },
    {
      src: "/images/gallery/horizontal-4.jpg",
      alt: "image",
      orientation: "horizontal",
    },
    {
      src: "/images/gallery/vertical-3.jpg",
      alt: "image",
      orientation: "vertical",
    },
  ],
};

export { person, social, album, gallery };
