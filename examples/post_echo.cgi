#!/usr/bin/perl

use strict;
use warnings;
use warnings qw( FATAL utf8 );

use v5.14; # optimal for unicode string feature
use utf8;
use open qw( :encoding(UTF-8) :std );

use Data::Dumper;
use CGI qw/:all/;
use IO::Handle;
use IO::File;
use Scalar::Util qw/blessed/;


my $q = CGI->new();
my %headers = map { $_ => $q->http($_) } $q->http();
print STDERR "Got the following headers:\n";
for my $header ( keys %headers )
{
    print STDERR "$header: $headers{$header}\n";
}

print $q->header('text/html; charset=utf-8');

my $text = "";
# my $text = "<!DOCTYPE HTML>\n\n";
# $text .= "<html><body>";

my @params = $q->param();
if ( @params > 0 )
{
    $text .= "<ul class='param_values'>\n";
    for my $p (@params)
    {
    	# print STDERR "\n================================ p=$p\n";
        my @values = $q->param($p);
        for my $v (@values)
        {
        	# print STDERR "p=$p >>>> v=$v //// $q->upload($p)\n";
        	my $lightweight_fh  = $q->upload($p);
            if ( defined $lightweight_fh )
            {
            	my $io_handle= $lightweight_fh->handle;
        		# print STDERR '*** blessed( $io_handle ) = ' . blessed( $io_handle ) . "\n**************\n" . '$io_handle = ' . Dumper( $io_handle );
                open( OUTFILE, '>>', '/dev/null' );
                my $buffer;
                my $bytes = 0;
                while ( my $bytesread = $io_handle->read( $buffer, 1024 ) )
                {
                	$bytes += $bytesread;
                    print OUTFILE $buffer;
                }
                $text .= qq|
                <li class='fileupload'>
                	<div class='fieldname'>$p</div>
                	<div class'filename'>$v</div>
                	<div class='filelen'>$bytes</div>
            	</li>\n|;
            }
            else
            {
                $text .= "<li>$p=$v</li>\n";
            }
        }
    }
    $text .= "</ul>\n";
}

# $text .= "</body></html>";

print $text;

my $filename = "/tmp/post_echo.log";
# my $encoding = ":encoding(UTF-8)";

# open( my $fh, ">> $encoding", $filename )
open( my $fh, ">>", $filename )
    or die "Could not open file '$filename' $!";
print $fh $text;
close($fh);

exit(0);
