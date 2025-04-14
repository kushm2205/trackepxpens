import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "kushp2224@gmail.com",
    pass: "ptxn kpaf caul zjdf",
  },
});

export default transporter;
