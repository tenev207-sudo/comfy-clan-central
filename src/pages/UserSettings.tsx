import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft, User, Bell, Sliders, Shield, LineChart, WalletCards } from "lucide-react";
import DeleteAccountButton from "@/components/DeleteAccountButton";
import Navbar from "@/components/Navbar";

const UserSettings = () => {
  return (
    <div className="min-h-screen bg-muted/20">
      <Navbar />
      <div className="container mx-auto px-4 py-8 max-w-4xl pt-24">
        <Link to="/" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors">
          <ArrowLeft className="mr-2 h-4 w-4" /> Назад към Начало
        </Link>
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Потребителски настройки (User Settings)</h1>
          <p className="text-muted-foreground">Управлявайте вашия профил, известия и предпочитания.</p>
        </div>

        <div className="grid gap-6">
          {/* Profile Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><User className="h-5 w-5 text-primary" /> Profile Info</CardTitle>
              <CardDescription>Актуализирайте личните си данни.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Име (Name)</Label>
                  <Input id="name" placeholder="John Doe" defaultValue="Иван Иванов" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Имейл (Email)</Label>
                  <Input id="email" type="email" placeholder="john@example.com" defaultValue="ivan@example.com" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Телефон (Phone)</Label>
                  <Input id="phone" type="tel" placeholder="+359..." defaultValue="+359 88 123 4567" />
                </div>
              </div>
              <Button>Запази промените</Button>
            </CardContent>
          </Card>

          {/* Notifications */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Bell className="h-5 w-5 text-primary" /> Notifications</CardTitle>
              <CardDescription>Изберете какви известия искате да получавате.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">New offers near me</Label>
                  <p className="text-sm text-muted-foreground">Получавайте известия за нови оферти във вашия район.</p>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">Favorite shops updates</Label>
                  <p className="text-sm text-muted-foreground">Известия, когато любимите ви обекти публикуват нови кутии.</p>
                </div>
                <Switch defaultChecked />
              </div>
            </CardContent>
          </Card>

          {/* Preferences */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Sliders className="h-5 w-5 text-primary" /> Preferences</CardTitle>
              <CardDescription>Диетични ограничения и предпочитания.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="flex items-center space-x-2">
                  <Checkbox id="vegan" />
                  <Label htmlFor="vegan" className="font-normal text-base cursor-pointer">Vegan</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox id="vegetarian" />
                  <Label htmlFor="vegetarian" className="font-normal text-base cursor-pointer">Vegetarian</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox id="gluten-free" />
                  <Label htmlFor="gluten-free" className="font-normal text-base cursor-pointer">Gluten-free</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox id="dairy-free" />
                  <Label htmlFor="dairy-free" className="font-normal text-base cursor-pointer">Dairy-free</Label>
                </div>
              </div>
              <Button variant="outline">Запази предпочитанията</Button>
            </CardContent>
          </Card>

          {/* Impact Dashboard */}
          <Card className="border-primary/20 bg-primary/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><LineChart className="h-5 w-5 text-primary" /> Impact Dashboard</CardTitle>
              <CardDescription>Вашият принос към опазването на околната среда.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="bg-background rounded-lg p-6 flex flex-col items-center justify-center text-center shadow-sm border border-border/50">
                  <span className="text-muted-foreground mb-2 font-medium">Money Saved</span>
                  <span className="text-4xl font-extrabold text-green-600">124.50 лв.</span>
                </div>
                <div className="bg-background rounded-lg p-6 flex flex-col items-center justify-center text-center shadow-sm border border-border/50">
                  <span className="text-muted-foreground mb-2 font-medium">CO2 Emissions Prevented</span>
                  <span className="text-4xl font-extrabold text-blue-600">12.4 kg</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Security */}
          <Card className="border-destructive/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Shield className="h-5 w-5 text-primary" /> Security & Payments</CardTitle>
              <CardDescription>Управлявайте вашите методи на плащане и сигурността на профила си.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h3 className="font-semibold flex items-center gap-2"><WalletCards className="h-4 w-4" /> Linked Payment Methods</h3>
                <div className="bg-muted p-4 rounded-md flex justify-between items-center">
                  <span className="text-sm font-medium">Visa завършваща на **** 4242</span>
                  <Button variant="outline" size="sm">Премахни</Button>
                </div>
                <Button variant="outline" size="sm">Добави нов метод на плащане</Button>
              </div>
              
              <div className="pt-6 border-t border-border mt-6">
                <h3 className="text-destructive font-semibold mb-2">Опасна зона</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Изтриването на акаунта е необратимо. Моля, бъдете сигурни.
                </p>
                <DeleteAccountButton />
              </div>
            </CardContent>
          </Card>

        </div>
      </div>
    </div>
  );
};

export default UserSettings;
