# Huong dan Firebase cho PeBack

File nay viet theo kieu tung buoc, de ban chi can lam lan luot.

## 1. Firebase dang dung

Project cua ban:

- `projectId`: `peback-b29c2`
- `authDomain`: `peback-b29c2.firebaseapp.com`

Code da duoc cap nhat san de dung bo config nay. Ban van nen tao `.env.local` de quan ly cho gon.

## 2. Bat Authentication

1. Mo [Firebase Console](https://console.firebase.google.com/)
2. Chon project `peback-b29c2`
3. Vao `Build` -> `Authentication`
4. Bam `Get started`
5. Vao tab `Sign-in method`
6. Bat `Email/Password`
7. Bam `Save`

Luu y:

- App nay dang cho user dang nhap bang `username`
- Ben trong Firebase Auth, code se tu doi `username` thanh email gia lap theo mau: `username@peback.local`
- Cach nay an toan hon viec luu mat khau trong Firestore

## 3. Bat Firestore Database

1. Vao `Build` -> `Firestore Database`
2. Bam `Create database`
3. Chon `Start in production mode`
4. Chon region gan ban nhat
5. Tao database

## 4. Nap Firestore Rules

1. Trong Firebase Console vao `Firestore Database`
2. Mo tab `Rules`
3. Xoa rules cu
4. Copy toan bo noi dung file [firestore.rules](E:/nothing/PeBack/firestore.rules)
5. Bam `Publish`

Rules nay se dam bao:

- User chi doc du lieu cua chinh minh
- User khong tu sua `balance`
- User khong tu sua `role`
- User chi tao don hang voi trang thai `processing`
- User chi tao rut tien voi trang thai `pending`
- Chi admin moi them san pham, duyet don, sua so du, xu ly rut tien

## 5. Tao `.env.local`

Tao file `.env.local` trong thu muc project va dan dung noi dung nay:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyD8jjDfybzSL0tt59nLhYmNB4o3ok3L6T4
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=peback-b29c2.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=peback-b29c2
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=peback-b29c2.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=747864743692
NEXT_PUBLIC_FIREBASE_APP_ID=1:747864743692:web:de7926daabdd8d89b03329
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=G-DWM76HN7MN
```

Neu may chua co Firebase CLI, cai truoc:

```bash
npm.cmd install -g firebase-tools
firebase.cmd login
```

## 6. Chay project local

Trong terminal, dung:

```bash
npm.cmd install
npm.cmd run dev
```

Mo:

- User web: `http://localhost:3000`
- Admin web local: `http://localhost:3000/admin`

## 7. Tao tai khoan admin

Vi giao dien dang ky mac dinh tao role `user`, ban can tao admin thu cong 1 lan.

### Cach de lam nhat

1. Dang ky mot tai khoan moi tren web, vi du `adminteam`
2. Vao `Firestore Database` -> collection `users`
3. Tim document co `username = adminteam`
4. Sua truong `role` thanh `admin`
5. Luu lai
6. Dang xuat va dang nhap lai
7. Truy cap `/admin`

## 8. Deploy len Firebase

Chay lan luot o thu muc goc project:

```bash
firebase.cmd deploy --only firestore:rules
```

## 9. Cau truc du lieu

### Collection `users`

```json
{
  "id": "firebase-auth-uid",
  "username": "partner01",
  "role": "user",
  "balance": 0,
  "linkedBank": null,
  "createdAt": "2026-03-21T00:00:00.000Z"
}
```

### Collection `products`

```json
{
  "id": "p-abc",
  "name": "Ten san pham",
  "category": "Cong nghe",
  "imageUrl": "https://...",
  "price": 590000,
  "commissionPercent": 12,
  "commissionValue": 70800,
  "affiliateLink": "https://shopee.vn/...",
  "description": "Mo ta",
  "isActive": true,
  "createdAt": "2026-03-21T00:00:00.000Z"
}
```

### Collection `orders`

```json
{
  "id": "o-abc",
  "orderCode": "SHOPEE-1001",
  "userId": "firebase-auth-uid",
  "username": "partner01",
  "productId": "p-abc",
  "productName": "Ten san pham",
  "affiliateLink": "https://shopee.vn/...",
  "commissionValue": 70800,
  "status": "processing",
  "submittedAt": "2026-03-21T00:00:00.000Z"
}
```

### Collection `withdrawals`

```json
{
  "id": "w-abc",
  "userId": "firebase-auth-uid",
  "username": "partner01",
  "amount": 50000,
  "bankName": "Vietcombank",
  "accountNumber": "0123456789",
  "accountHolder": "Nguyen Van A",
  "status": "pending",
  "requestedAt": "2026-03-21T00:00:00.000Z"
}
```

## 10. Neu gap loi

### Loi khong dang ky duoc

Thuong la do chua bat `Email/Password` trong Authentication.

### Loi khong vao duoc admin

Thuong la do document user trong `users` chua co `role = admin`.

### Loi `Missing or insufficient permissions`

Thuong la do:

- chua publish `Rules`
- document `users/{uid}` chua dung format
- dang sua du lieu ma rule khong cho phep

## 11. Muc bao mat hien tai

Ban nay da tot hon ban dau o cho:

- Khong luu mat khau trong Firestore nua
- Admin page co chan role
- Firestore co rules chan sua `balance` trai phep
- Admin thao tac bang tai khoan `admin` da dang nhap, duoc Rules kiem soat

De manh hon nua ve sau nen them:

- Firebase App Check
- ma hoa them thong tin ngan hang neu can
