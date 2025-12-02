// === Konstanta API dan Token ===
const app_id = 2;
const token = 'DpacnJf3uEQeM7HN';
const otpUrl = 'https://devapieei.katib.cloud/login';
const loginUrl = 'https://devapieei.katib.cloud/otp/login';
const expiredTime = new Date().getTime() + 7 * 24 * 60 * 60 * 1000; // 7 hari



// === Elemen DOM ===
const phoneInput = document.getElementById('phone');
const sendOtpButton = document.getElementById('send-otp');
const messageOTP = document.getElementById('messageOTP');
const loadingOTP = document.getElementById('loadingOTP');
const otpLabel = document.querySelector('label[for="otp"]');
const otpInputContainer = document.getElementById('otp').parentNode;

// === Variabel Global ===
let popupTimeout;
let currentPopup;
let currentUser = null;

// === Validasi Input Nomor Telepon ===
phoneInput?.addEventListener('input', function () {
  const inputValue = this.value.trim();
  const isValid = /^\d+$/.test(inputValue);

  if (inputValue === '') {
    sendOtpButton.disabled = true;
    sendOtpButton.classList.replace('btn-info', 'btn-secondary');
    messageOTP.textContent = '';
  } else if (!isValid) {
    sendOtpButton.disabled = true;
    sendOtpButton.classList.replace('btn-info', 'btn-secondary');
    messageOTP.textContent = 'Mohon masukkan hanya angka untuk nomor Whatsapp.';
    messageOTP.style.color = 'red';
  } else {
    sendOtpButton.disabled = false;
    sendOtpButton.classList.replace('btn-secondary', 'btn-info');
    messageOTP.textContent = '';

  }

  clearOTPInput();
});

// === Kirim OTP ===
sendOtpButton?.addEventListener('click', async function () {
  const phoneNumber = phoneInput?.value.trim();
  if (!phoneNumber) {
    messageOTP.textContent = 'Nomor Whatsapp tidak boleh kosong';
    messageOTP.style.color = 'red';
    return;
  }

  showLoading();
  sendOtpButton.disabled = true;

  try {
    const response = await fetch(`${otpUrl}/${app_id}/${phoneNumber}`, { method: 'GET' });
    const result = await response.json();

    if (!response.ok) {
    messageOTP.textContent = 'Nomor Whatsapp tidak terdaftar!';
    messageOTP.style.color = 'red';
    } else if (result?.data) {
      currentUser = { phone: phoneNumber };
      messageOTP.textContent = 'OTP telah dikirim ke WhatsApp anda!';
      messageOTP.style.color = 'green';
      showOTPInput();
      phoneInput.readOnly = true;
    } else {
      messageOTP.textContent = 'Gagal mengirim OTP. Silahkan coba lagi.';
      messageOTP.style.color = 'red';
    }
  } catch (error) {
    console.error('Error fetching OTP:', error);
    messageOTP.textContent = 'Gagal mengirim OTP. Silahkan coba lagi.';
    messageOTP.style.color = 'red';
  } finally {
    hideLoading();
    sendOtpButton.disabled = false;
  }
});

// === Buat Input OTP Dinamis ===
function createOTPInputs() {
  const existing = document.getElementById('otp-inputs');
  if (existing) existing.remove();

  const container = document.createElement('div');
  container.id = 'otp-inputs';
  container.style.cssText = 'display: flex; justify-content: space-between; margin: 10px 0 20px';

  for (let i = 0; i < 6; i++) {
    const input = document.createElement('input');
    input.type = 'text';
    input.maxLength = 1;
    input.className = 'otp-input';
    input.style.cssText = 'width: 40px; height: 40px; font-size: 24px; text-align: center; margin: 0 5px';
    input.dataset.index = i;

    input.addEventListener('input', function () {
      this.value = this.value.replace(/\D/g, '');
      if (this.value && this.nextElementSibling) {
        this.nextElementSibling.focus();
      } else {
        validateFullOTP();
      }
    });

    input.addEventListener('keydown', function (e) {
      if (e.key === 'Backspace' && !this.value && this.previousElementSibling) {
        this.previousElementSibling.focus();
      }
    });

    input.addEventListener('paste', function (e) {
      const data = e.clipboardData.getData('Text');
      if (data.length === 6) {
        for (let j = 0; j < 6; j++) {
          if (container.children[j]) {
            container.children[j].value = data[j];
          }
        }
        validateFullOTP();
      }
      e.preventDefault();
    });

    container.appendChild(input);
  }

  otpInputContainer.appendChild(container);
}

// === Validasi OTP Lengkap ===
async function validateFullOTP() {
  const otp = [...document.querySelectorAll('.otp-input')].map(i => i.value).join('');

  if (otp.length === 6 && /^\d+$/.test(otp)) {
    showLoading();
    try {
      const response = await fetch(loginUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: currentUser.phone, otp })
      });

      const result = await response.json();
      console.log('API Response:', result);
      hideLoading();

      if (response.ok && result.owner_id && result.user_id) {
        localStorage.setItem('user', JSON.stringify(result, expiredTime));
        window.location.href = 'index.html';
      } else {
        // showPopup(result.message || 'OTP tidak valid. Silakan coba lagi.', false);
        clearOTPInput();
      }
    } catch (error) {
      console.error('Error validating OTP:', error);
      // showPopup('Terjadi kesalahan saat memvalidasi OTP.', false);
      hideLoading();
    }
  } else {
    // showPopup('OTP harus berupa 6 digit angka.', false);
  }
}

// === Utilitas ===
function lockInputs(lock) {
  phoneInput.readOnly = lock;
  document.querySelectorAll('.otp-input').forEach(i => i.readOnly = lock);
  sendOtpButton.disabled = lock;
}

function clearOTPInput() {
  document.querySelectorAll('.otp-input').forEach(input => {
    input.value = '';
    input.readOnly = false;
  });
  phoneInput.readOnly = false;
  sendOtpButton.disabled = false;
}

function showOTPInput() {
  if (otpLabel) otpLabel.style.display = 'block';
  createOTPInputs();
  document.querySelector('.otp-input')?.focus();
}

function showPopup(message, isSuccess = true) {
  hidePopup();
  const popup = document.createElement('div');
  popup.className = isSuccess ? 'popup-card success' : 'popup-card error';
  popup.textContent = message;
  document.body.appendChild(popup);
  setTimeout(() => popup.classList.add('show'), 10);
  currentPopup = popup;
  popupTimeout = setTimeout(hidePopup, 3000);
}

function hidePopup() {
  if (currentPopup) {
    clearTimeout(popupTimeout);
    currentPopup.classList.remove('show');
    setTimeout(() => currentPopup?.remove(), 300);
    currentPopup = null;
  }
}

function showLoading() {
  if (loadingOTP) {
    loadingOTP.style.display = 'block';
  }
}

function hideLoading() {
  if (loadingOTP) {
    loadingOTP.style.display = 'none';
  }
}

