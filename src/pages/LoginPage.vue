<template>
  <div class="login-page">
    <div class="login-box">
      <h2>Login to Chat App</h2>
      <form @submit.prevent="registerUser">
        <input v-model="username" type="text" placeholder="Username" required />
        <input v-model="email" type="email" placeholder="Email" required />
        <input v-model="appName" type="text" placeholder="App Name" required />
        <button type="submit">Login</button>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import axios from "axios";
import { ref } from "vue";
import { useRouter } from "vue-router";
import Swal from "sweetalert2";

const username = ref("");
const email = ref("");
const appName = ref("");
const router = useRouter();

async function registerUser() {
  try {
    const response = await axios.post(
      "http://192.168.31.100:4000/user/register",
      {
        name: username.value,
        email: email.value,
        appName: appName.value,
        fcmToken: "",
      }
    );

    // Save user info locally (if needed)
    localStorage.setItem("user", JSON.stringify(response.data?.data));

    // Redirect to login or chat page
    router.push("/");
  } catch (err: any) {
    Swal.fire({
      title: "Oops!",
      text: "Something went wrong. Please try again.",
      icon: "error",
      confirmButtonText: "Retry",
    });
    error.value = err.response?.data?.message || "Registration failed";
  }
}
</script>

<style scoped>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

.login-page {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 20px;
  font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
}

.login-box {
  background: white;
  padding: 40px;
  border-radius: 12px;
  box-shadow: 0 0 15px rgba(0, 0, 0, 0.2);
  width: 100%;
  max-width: 400px;
  text-align: center;
  /* animation: fadeIn 0.4s ease-in-out; */
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}

.login-box h2 {
  margin-bottom: 24px;
  color: #333;
}

.login-box input {
  width: 100%;
  padding: 12px;
  margin-bottom: 16px;
  border: 1px solid #ccc;
  border-radius: 6px;
  font-size: 16px;
  transition: 0.3s;
}

.login-box input:focus {
  border-color: #3498db;
  outline: none;
  box-shadow: 0 0 6px rgba(52, 152, 219, 0.4);
}

.login-box button {
  width: 100%;
  padding: 12px;
  background-color: #3498db;
  border: none;
  color: white;
  font-size: 16px;
  border-radius: 6px;
  cursor: pointer;
  transition: background-color 0.3s ease;
}

.login-box button:hover {
  background-color: #2980b9;
}

/* Responsive tweaks */
@media (max-width: 480px) {
  .login-box {
    padding: 12px;
    max-width: 90%;
  }

  .login-box h2 {
    font-size: 20px;
  }

  .login-box input,
  .login-box button {
    font-size: 14px;
    padding: 10px;
  }
}
</style>
