# PeBack

Nen tang MVP chia se hoa hong cho san pham Shopee Affiliate, gom:

- Web user: dang ky, dang nhap, xem san pham theo danh muc, mua qua affiliate link, gui ma don hang, lien ket ngan hang va rut tien.
- Web admin local: them san pham, cai dat gia va hoa hong, duyet don hang thu cong, quan ly so du user, xu ly yeu cau rut tien.

## Cong nghe

- Next.js 15 + React 19
- Firebase Auth + Firestore
- Local session qua `localStorage`

## Cai dat

```bash
npm.cmd install
Copy-Item .env.example .env.local
npm.cmd run dev
```

Mo:

- User web: `http://localhost:3000`
- Admin local: `http://localhost:3000/admin`

## Firebase

Tao project Firebase va bat Firestore. Dien cac bien trong `.env.local`.

Collections duoc dung:

- `users`
- `products`
- `orders`
- `withdrawals`

Bao mat da duoc nang cap:

- Mat khau di qua Firebase Authentication, khong luu trong Firestore nua
- Firestore co `rules` de chan user thuong sua `balance`, `role` va duyet don trai phep
- Admin page yeu cau role `admin`
- Admin client thao tac truc tiep len Firestore bang tai khoan `admin`

Tren Windows PowerShell, neu bi chan file `.ps1`, hay dung `firebase.cmd` va `npm.cmd`.

Huong dan setup cuc ky chi tiet nam o [FIREBASE_SETUP.md](E:/nothing/PeBack/FIREBASE_SETUP.md).

## Luong chinh

1. Admin them san pham trong `/admin`.
2. User dang ky hoac dang nhap tai `/` qua Firebase Auth.
3. User bam mua de di thang sang affiliate link.
4. User gui ma don hang, trang thai ban dau la `processing`.
5. Admin confirm don trong `/admin`, khi do hoa hong duoc cong vao `balance` cua user.
6. User lien ket ngan hang 1 lan va gui yeu cau rut tien.
