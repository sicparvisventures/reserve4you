# 🔍 CHECK AUTHENTICATION

Plak dit in de **Browser Console** (F12):

```javascript
// Check if user is authenticated
async function checkAuth() {
  console.log('🔍 Checking authentication...');
  
  // Check 1: Cookies
  console.log('📋 Cookies:', document.cookie);
  
  // Check 2: Try to fetch user
  try {
    const response = await fetch('/api/user', {
      credentials: 'include',
    });
    
    if (response.ok) {
      const user = await response.json();
      console.log('✅ User authenticated:', user);
      return user;
    } else {
      console.log('❌ Not authenticated, status:', response.status);
      const error = await response.json();
      console.log('❌ Error:', error);
      return null;
    }
  } catch (error) {
    console.log('❌ Auth check failed:', error);
    return null;
  }
}

checkAuth();
```

---

## **Mogelijke Oorzaken:**

1. **Session expired** - Je moet opnieuw inloggen
2. **Cookie niet meegestuurd** - Browser security issue
3. **Middleware blocking** - Route wordt geblokkeerd

---

## **QUICK FIX: Herstart de Browser Flow**

1. **Logout** (als je een logout knop hebt)
2. **Of clear browser data:**
   - Open Developer Tools (F12)
   - Ga naar **Application** tab (Chrome) of **Storage** tab (Firefox)
   - Click **Clear site data**
3. **Login opnieuw:**
   - Ga naar `http://localhost:3007/sign-in`
   - Log in
4. **Start onboarding opnieuw:**
   - Ga naar `http://localhost:3007/manager/onboarding?step=1`
   - Doe stap 1 opnieuw

---

Let me also check the API route to see what might be wrong:

