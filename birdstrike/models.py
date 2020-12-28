# This is an auto-generated Django model module.
# You'll have to do the following manually to clean this up:
#   * Rearrange models' order
#   * Make sure each model has one field with primary_key=True
#   * Make sure each ForeignKey and OneToOneField has `on_delete` set to the desired behavior
#   * Remove `managed = False` lines if you wish to allow Django to create, modify, and delete the table
# Feel free to rename the models, but don't rename db_table values or field names.
from django.db import models


class BirdsLog(models.Model):
    logid = models.AutoField(primary_key=True)
    lat = models.DecimalField(max_digits=18, decimal_places=15)
    lng = models.DecimalField(max_digits=18, decimal_places=16)
    alt = models.DecimalField(max_digits=21, decimal_places=16)
    time = models.CharField(max_length=5)

    class Meta:
        managed = False
        db_table = 'birds_log'

class Georef(models.Model):
    georedif = models.CharField(db_column='GEOREDIF', primary_key=True, max_length=4)  # Field name made lowercase.
    p1lat = models.DecimalField(db_column='P1LAT', max_digits=11, decimal_places=8)  # Field name made lowercase.
    p1lng = models.DecimalField(db_column='P1LNG', max_digits=11, decimal_places=8)  # Field name made lowercase.
    p2lat = models.DecimalField(db_column='P2LAT', max_digits=11, decimal_places=8)  # Field name made lowercase.
    p2lng = models.DecimalField(db_column='P2LNG', max_digits=11, decimal_places=8)  # Field name made lowercase.
    p3lat = models.DecimalField(db_column='P3LAT', max_digits=11, decimal_places=8)  # Field name made lowercase.
    p3lng = models.DecimalField(db_column='P3LNG', max_digits=11, decimal_places=8)  # Field name made lowercase.
    p4lat = models.DecimalField(db_column='P4LAT', max_digits=11, decimal_places=8)  # Field name made lowercase.
    p4lng = models.DecimalField(db_column='P4LNG', max_digits=11, decimal_places=8)  # Field name made lowercase.

    class Meta:
        managed = False
        db_table = 'georef'
