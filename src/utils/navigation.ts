// An array of links for navigation bar
const navBarLinks = [
  { name: "Home", url: "/" },
  { name: "Services", url: "/services" },
  { name: "About", url: "/about" },
  { name: "Reviews", url: "/reviews" },
  { name: "Contact", url: "/contact" },
];
// An array of links for footer
const footerLinks = [
  {
    section: "Services",
    links: [
      { name: "Dog Training", url: "/services/dog-training" },
      { name: "Puppy Training", url: "/services/puppy-training" },
      { name: "Gundog Training", url: "/services/gundog-training" },
      { name: "Training Walks", url: "/services/training-walks" },
      { name: "Behaviour Problems", url: "/services/behaviour-problems" },
      { name: "Show Training", url: "/services/show-training" },
    ],
  },
  {
    section: "Company",
    links: [
      { name: "About us", url: "/about" },
      { name: "Reviews", url: "/reviews" },
      { name: "Contact", url: "/contact" },
      { name: "Resources", url: "/resources" },
    ],
  },
];
// An object of links for social icons
const socialLinks = {
  facebook: "https://www.facebook.com/topbarks",
  x: "https://twitter.com/topbarks",
  instagram: "https://www.instagram.com/topbarks",
};

export default {
  navBarLinks,
  footerLinks,
  socialLinks,
};