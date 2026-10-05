function verificationEmailTemplate(code) {
  return `
    <!DOCTYPE html>

    <html>
      <head>

        <meta charset="UTF-8">

        <title>
          EventHub Email Tasdiqlash
        </title>

      </head>

      <body style="
        margin: 0;
        padding: 0;
        background-color: #f4f4f4;
        font-family: Arial, sans-serif;
      ">

        <div style="
          max-width: 600px;
          margin: 40px auto;
          background: white;
          padding: 40px;
          border-radius: 12px;
        ">

          <h1 style="text-align: center;">
            EventHub
          </h1>

          <h2>
            Salom!
          </h2>

          <p>
            EventHub platformasiga
            ro'yxatdan o'tganingiz uchun rahmat.
          </p>

          <p>
            Email manzilingizni tasdiqlash
            uchun quyidagi kodni kiriting:
          </p>

          <div style="
            text-align: center;
            font-size: 32px;
            font-weight: bold;
            letter-spacing: 8px;
            margin: 30px 0;
          ">
            ${code}
          </div>

          <p>
            Ushbu kod
            <strong>10 daqiqa</strong>
            amal qiladi.
          </p>

          <p>
            Agar bu ro'yxatdan o'tishni siz
            amalga oshirmagan bo'lsangiz,
            ushbu xabarni e'tiborsiz qoldiring.
          </p>

          <hr>

          <p style="
            text-align: center;
            color: #777;
          ">
            EventHub jamoasi
          </p>

        </div>

      </body>
    </html>
  `;
}

function welcomeEmailTemplate(fullName) {
  return `
    <!DOCTYPE html>

    <html>

      <body style="
        font-family: Arial, sans-serif;
        background-color: #f4f4f4;
        padding: 40px;
      ">

        <div style="
          max-width: 600px;
          margin: auto;
          background: white;
          padding: 40px;
          border-radius: 12px;
        ">

          <h1>
            EventHub
          </h1>

          <h2>
            Xush kelibsiz, ${fullName}!
          </h2>

          <p>
            Email manzilingiz muvaffaqiyatli
            tasdiqlandi.
          </p>

          <p>
            Endi EventHub'dagi tadbirlarga
            ro'yxatdan o'tishingiz mumkin.
          </p>

          <p>
            EventHub jamoasi
          </p>

        </div>

      </body>

    </html>
  `;
}

export { verificationEmailTemplate, welcomeEmailTemplate };
