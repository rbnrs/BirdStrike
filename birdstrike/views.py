
from django.http import HttpResponse
from django.shortcuts import render

def home(request):
    mapData = {
        'lat': 49.47395052395855,
        'lng': 9.361480586539184,
        }
    return render(request, "home.html", mapData)

def default(request): 
    return HttpResponse("Default")    

def notFound(request): 
    return HttpResponse("Not Found")    