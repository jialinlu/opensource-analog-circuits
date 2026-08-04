.title ldo_2_asap7_tb
* Testbench for ldo_2 (ASAP7). Corner is selected by the .lib section below;
* run all 12 corners with run_corners.sh (see README.md).
.include "circuit_asap7.cir"
* ldo_2 migrated from sky130 (1.8V) to ASAP7 (0.7V)
* Devices: ASAP7 BSIM-CMG (level=72), parameterized by NFIN and L (nm)
* Passives: sky130 MIM caps / poly resistor replaced by ideal C / R
* Vout = Vref (unity feedback), target Vref = 0.45V, Iload max 100mA
***************************************
* Circuit netlist
***************************************
.lib "../../asap7_pdk/models/ngspice/asap7_osdi_corners.lib" tt_nom
***************************************
* Circuit parameters
***************************************
.param L_NM0=21n N_NM0=30
.param L_NM1=21n N_NM1=21
.param L_NM2=21n N_NM2=50
.param L_NM3=21n N_NM3=252
.param L_NM4=21n N_NM4=N_NM3
.param L_NM6=21n N_NM6=25
.param L_NM7=21n N_NM7=31
.param L_NM8=21n N_NM8=57
.param L_NM9=21n N_NM9=N_NM8
.param L_NM10=21n N_NM10=104
.param L_PM0=21n N_PM0=36
.param L_PM1=21n N_PM1=10
.param L_PM2=21n N_PM2=29
.param L_PM3=21n N_PM3=26
.param L_PM4=21n N_PM4=13846
.param L_PM5=21n N_PM5=126
.param L_PM6=21n N_PM6=54
.param L_PM7=21n N_PM7=30
.param L_PM8=21n N_PM8=21
.param L_PM9=21n N_PM9=N_PM8
.param current_0_bias=1.707e-05
.param R_R0=345.1
.param C_C0=44.31
.param C_C1=2.427
.param C_C4=1.886
.param C_LOAD=871.7
.PARAM VDD_NOM = 0.7
.PARAM supply_voltage = 'VDD_NOM*vdd_scale'
.PARAM Vref = 0.45
.PARAM PARAM_ILOAD =100m
V1 vdd 0 'supply_voltage'
V2 vss 0 0
Vindc vref_in 0 'Vref'
Vin signal_in 0 dc 'Vref' ac 1 sin('Vref' 10m 500)
***************************************
* Testbenches
***************************************
*    ADM TB
x1 vss vdd vref_in vout1 vfb1 vinp1 Ib ldo_2_asap7
Ib vdd Ib DC='current_0_bias'
Lfb vinp1 vfb1 1T
Cfb vinp1 signal_in 1T
CL1 vout1 0 {C_LOAD*1p}
Iload1 vout1 0 'PARAM_ILOAD'
.nodeset v(vout1)=0.45
.control
pre_osdi ../../asap7_pdk/models/ngspice/bsimcmg_va.osdi
set seed=1234
set units=degrees
let NRUN = 200

* per-device Vth-mismatch sigma (Pelgrom-style assumption, see header;
* refreshed by benchmark/run_mc_baseline.py when sizes change)
* NM10: L=0.021um NFIN=104
let sg_nm10 = 5.1151e-03
* NM9: L=0.021um NFIN=57
let sg_nm9 = 6.9093e-03
* NM8: L=0.021um NFIN=57
let sg_nm8 = 6.9093e-03
* NM7: L=0.021um NFIN=31
let sg_nm7 = 9.3689e-03
* NM6: L=0.021um NFIN=25
let sg_nm6 = 1.0433e-02
* NM4: L=0.021um NFIN=252
let sg_nm4 = 3.2860e-03
* NM3: L=0.021um NFIN=252
let sg_nm3 = 3.2860e-03
* NM2: L=0.021um NFIN=50
let sg_nm2 = 7.3771e-03
* NM1: L=0.021um NFIN=21
let sg_nm1 = 1.1383e-02
* NM0: L=0.021um NFIN=30
let sg_nm0 = 9.5238e-03
* NP9: L=0.021um NFIN=21
let sg_np9 = 1.1383e-02
* NP8: L=0.021um NFIN=21
let sg_np8 = 1.1383e-02
* NP7: L=0.021um NFIN=30
let sg_np7 = 9.5238e-03
* NP6: L=0.021um NFIN=54
let sg_np6 = 7.0986e-03
* NP5: L=0.021um NFIN=126
let sg_np5 = 4.6471e-03
* NP4: L=0.021um NFIN=1.385e+04
let sg_np4 = 4.4331e-04
* NP3: L=0.021um NFIN=26
let sg_np3 = 1.0230e-02
* NP2: L=0.021um NFIN=29
let sg_np2 = 9.6866e-03
* NP1: L=0.021um NFIN=10
let sg_np1 = 1.6496e-02
* NP0: L=0.021um NFIN=36
let sg_np0 = 8.6940e-03

let run = 0
while run < NRUN
  * draw per-device mismatch for this sample
  alter @n.x1.nm10[delvtrand] = sg_nm10*sgauss(0)
  alter @n.x1.nm9[delvtrand] = sg_nm9*sgauss(0)
  alter @n.x1.nm8[delvtrand] = sg_nm8*sgauss(0)
  alter @n.x1.nm7[delvtrand] = sg_nm7*sgauss(0)
  alter @n.x1.nm6[delvtrand] = sg_nm6*sgauss(0)
  alter @n.x1.nm4[delvtrand] = sg_nm4*sgauss(0)
  alter @n.x1.nm3[delvtrand] = sg_nm3*sgauss(0)
  alter @n.x1.nm2[delvtrand] = sg_nm2*sgauss(0)
  alter @n.x1.nm1[delvtrand] = sg_nm1*sgauss(0)
  alter @n.x1.nm0[delvtrand] = sg_nm0*sgauss(0)
  alter @n.x1.np9[delvtrand] = sg_np9*sgauss(0)
  alter @n.x1.np8[delvtrand] = sg_np8*sgauss(0)
  alter @n.x1.np7[delvtrand] = sg_np7*sgauss(0)
  alter @n.x1.np6[delvtrand] = sg_np6*sgauss(0)
  alter @n.x1.np5[delvtrand] = sg_np5*sgauss(0)
  alter @n.x1.np4[delvtrand] = sg_np4*sgauss(0)
  alter @n.x1.np3[delvtrand] = sg_np3*sgauss(0)
  alter @n.x1.np2[delvtrand] = sg_np2*sgauss(0)
  alter @n.x1.np1[delvtrand] = sg_np1*sgauss(0)
  alter @n.x1.np0[delvtrand] = sg_np0*sgauss(0)

  alter Iload1 dc=100m
  op
  let vout_max = v(vout1)
  let iq_max = abs(i(v1))
  echo "MCRES $&run vout_max $&vout_max iq_max $&iq_max"
  ac dec 10 0.1 1G
  meas ac dcgain1 find vdb(vout1) at = 0.1
  meas ac ugf1 when vdb(vout1)=0
  meas ac pm1 find vp(vout1) when vdb(vout1)=0
  echo "MCRES $&run dcgain1 $&dcgain1 ugf1 $&ugf1 pm1 $&pm1"

  alter Iload1 dc=1m
  op
  let vout_min = v(vout1)
  let iq_min = abs(i(v1))
  echo "MCRES $&run vout_min $&vout_min iq_min $&iq_min"
  ac dec 10 0.1 1G
  meas ac dcgain2 find vdb(vout1) at = 0.1
  meas ac ugf2 when vdb(vout1)=0
  meas ac pm2 find vp(vout1) when vdb(vout1)=0
  echo "MCRES $&run dcgain2 $&dcgain2 ugf2 $&ugf2 pm2 $&pm2"
  let run = run + 1
end
.endc

.end
