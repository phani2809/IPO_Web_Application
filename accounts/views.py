from django.shortcuts import render, redirect
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.models import User
from django.contrib import messages
import re

def custom_login(request):
    if request.method == 'POST':
        username = request.POST['username']
        password = request.POST['password']
        user = authenticate(request, username=username, password=password)
        if user:
            login(request, user)
            return redirect('home')
        else:
            return render(request, 'accounts/login.html', {'error': 'Invalid credentials'})
    return render(request, 'accounts/login.html')

def signup(request):
    if request.method == 'POST':
        username = request.POST['username']
        email = request.POST['email']
        password = request.POST['password']

        # Basic validations
        if User.objects.filter(username=username).exists():
            messages.error(request, "Username already exists")
            return redirect('register')

        if User.objects.filter(email=email).exists():
            messages.error(request, "Email already in use")
            return redirect('register')

        if not re.match(r"[^@]+@[^@]+\.[^@]+", email):
            messages.error(request, "Invalid email format")
            return redirect('register')

        if len(password) < 8:
            messages.error(request, "Password must be at least 8 characters long")
            return redirect('register')

        # Create user
        user = User.objects.create_user(username=username, email=email, password=password)
        login(request, user)  # Auto login after registration
        return redirect('home')

    return render(request, 'accounts/register.html')

def home(request):
    return render(request, 'accounts/home.html')

def custom_logout(request):
    logout(request)
    return redirect('login')
