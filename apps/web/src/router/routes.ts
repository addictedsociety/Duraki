import type { RouteRecordRaw } from "vue-router";

const LoginView = () => import("@/views/LoginView.vue");
const DashboardView = () => import("@/views/DashboardView.vue");
const RoomView = () => import("@/views/RoomView.vue");
const GameView = () => import("@/views/GameView.vue");

export const routes: RouteRecordRaw[] = [
  { path: "/", redirect: "/dashboard" },
  { path: "/login", name: "login", component: LoginView, meta: { public: true } },
  {
    path: "/dashboard",
    name: "dashboard",
    component: DashboardView,
    meta: { requiresAuth: true },
  },
  { path: "/room", name: "room", component: RoomView, meta: { requiresAuth: true } },
  {
    path: "/game/:gameId",
    name: "game",
    component: GameView,
    props: true,
    meta: { requiresAuth: true },
  },
  { path: "/:pathMatch(.*)*", redirect: "/dashboard" },
];
